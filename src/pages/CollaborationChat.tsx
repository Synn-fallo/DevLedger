import { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Send, ArrowLeft, User, CheckCircle, Clock, XCircle, Users } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { collaborationService, type CollaborationRequest, type CollaborationMessage } from '../services/collaboration.service';
import { Footer } from '../components/Footer';

export function CollaborationChat() {
  const { requestId } = useParams();
  const [request, setRequest] = useState<CollaborationRequest | null>(null);
  const [messages, setMessages] = useState<CollaborationMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadUser();
  }, []);

  useEffect(() => {
    if (requestId && userEmail) {
      loadRequest();
      loadMessages();
      
      // Souscription aux nouveaux messages
      const subscription = supabase
        .channel('collaboration_messages')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'collaboration_messages', filter: `request_id=eq.${requestId}` },
          (payload) => {
            const newMsg = payload.new as CollaborationMessage;
            if (newMsg.sender_email !== userEmail) {
              setMessages(prev => [...prev, newMsg]);
              // Marquer comme lu
              collaborationService.markMessagesAsRead(requestId, userEmail);
            } else {
              setMessages(prev => [...prev, newMsg]);
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [requestId, userEmail]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email);
      setUserName(user.email?.split('@')[0] || 'Utilisateur');
    }
    setLoading(false);
  };

  const loadRequest = async () => {
    if (!requestId) return;
    
    // Récupérer la demande
    const { data: requestData } = await supabase
      .from('collaboration_requests')
      .select('*, projects(name, user_id)')
      .eq('id', requestId)
      .single();

    if (requestData) {
      const project = requestData.projects as any;
      setRequest({
        ...requestData,
        project_name: project?.name || 'Projet inconnu'
      } as CollaborationRequest);
      
      // Vérifier si l'utilisateur est le propriétaire
      if (userEmail) {
        setIsOwner(project?.user_id === (await supabase.auth.getUser()).data.user?.id);
      }
      
      // Marquer les messages comme lus
      if (userEmail) {
        await collaborationService.markMessagesAsRead(requestId, userEmail);
      }
    }
  };

  const loadMessages = async () => {
    if (!requestId) return;
    const msgs = await collaborationService.getMessages(requestId);
    setMessages(msgs);
    
    // Marquer comme lus
    if (userEmail) {
      await collaborationService.markMessagesAsRead(requestId, userEmail);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !requestId || !userEmail || !userName) return;

    setSending(true);
    
    const message = await collaborationService.sendMessage(
      requestId,
      userName,
      userEmail,
      newMessage.trim()
    );

    if (message) {
      setMessages(prev => [...prev, message]);
      setNewMessage('');
    }

    setSending(false);
  };

  const handleUpdateStatus = async (status: 'accepted' | 'rejected') => {
    if (!requestId) return;
    await collaborationService.updateRequestStatus(requestId, status);
    loadRequest();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getStatusBadge = () => {
    if (!request) return null;
    switch (request.status) {
      case 'pending':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"><Clock className="w-3 h-3" /> En attente</span>;
      case 'accepted':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"><CheckCircle className="w-3 h-3" /> Acceptée</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"><XCircle className="w-3 h-3" /> Refusée</span>;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">Demande non trouvée</p>
            <Link to="/dashboard" className="text-blue-600 hover:underline mt-2 inline-block">Retour au tableau de bord</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const canChat = request.status === 'accepted';
  const isParticipant = isOwner || request.requester_email === userEmail;

  if (!isParticipant) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-500">Vous n'avez pas accès à cette conversation.</p>
            <Link to="/dashboard" className="text-blue-600 hover:underline mt-2 inline-block">Retour au tableau de bord</Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-6">
        {/* En-tête */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <Link to="/dashboard" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Collaboration · {request.project_name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-500">
                    {request.requester_name}
                  </span>
                  {getStatusBadge()}
                </div>
              </div>
            </div>
            
            {isOwner && request.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleUpdateStatus('accepted')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors text-sm"
                >
                  Accepter
                </button>
                <button
                  onClick={() => handleUpdateStatus('rejected')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors text-sm"
                >
                  Refuser
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Zone de chat */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[500px]">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">Aucun message pour le moment</p>
                <p className="text-sm text-gray-400 mt-1">
                  {canChat ? 'Envoyez un premier message pour démarrer la conversation' : 'La conversation débutera une fois la demande acceptée'}
                </p>
              </div>
            ) : (
              messages.map((msg) => {
                const isCurrentUser = msg.sender_email === userEmail;
                return (
                  <div key={msg.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] ${isCurrentUser ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'} rounded-lg p-3`}>
                      {!isCurrentUser && (
                        <p className="text-xs font-medium mb-1 text-blue-600 dark:text-blue-400">
                          {msg.sender_name}
                        </p>
                      )}
                      <p className="text-sm">{msg.message}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Formulaire d'envoi */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            {canChat ? (
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Écrivez votre message..."
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={sending || !newMessage.trim()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            ) : (
              <p className="text-center text-gray-500 text-sm py-2">
                {request.status === 'pending' 
                  ? 'En attente de la réponse du propriétaire pour démarrer la conversation'
                  : 'Cette demande a été refusée'}
              </p>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}