import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { HelpCircle, Home, CheckCircle, Clock, AlertCircle, MessageCircle, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { technicalHelpService, type TechnicalHelpRequest, type TechnicalHelpResponse } from '../services/technicalHelp.service';
import { Footer } from '../components/Footer';

export function TechnicalHelpPage() {
  const [requests, setRequests] = useState<TechnicalHelpRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<TechnicalHelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<TechnicalHelpRequest | null>(null);
  const [responses, setResponses] = useState<TechnicalHelpResponse[]>([]);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [newSolution, setNewSolution] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    loadUser();
    loadRequests();
  }, []);

  useEffect(() => {
    filterRequests();
    setCurrentPage(1);
  }, [requests, searchTerm, statusFilter]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserEmail(user.email);
      setUserName(user.email?.split('@')[0] || 'Visiteur');
    }
  };

  const loadRequests = async () => {
    setLoading(true);
    const data = await technicalHelpService.getOpenRequests();
    setRequests(data);
    setLoading(false);
  };

  const filterRequests = () => {
    let filtered = [...requests];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r =>
        r.title.toLowerCase().includes(term) ||
        r.description.toLowerCase().includes(term) ||
        r.project_name?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    setFilteredRequests(filtered);
  };

  const handleViewRequest = async (request: TechnicalHelpRequest) => {
    setSelectedRequest(request);
    const responsesData = await technicalHelpService.getResponses(request.id);
    setResponses(responsesData);
  };

  const handleSubmitSolution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest || !newSolution.trim() || !userEmail || !userName) return;

    setSubmitting(true);
    const response = await technicalHelpService.addResponse(
      selectedRequest.id,
      userName,
      userEmail,
      newSolution.trim()
    );

    if (response) {
      setResponses([...responses, response]);
      setNewSolution('');
    }
    setSubmitting(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"><AlertCircle className="w-3 h-3" /> Ouvert</span>;
      case 'in_progress':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"><Clock className="w-3 h-3" /> En cours</span>;
      case 'resolved':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"><CheckCircle className="w-3 h-3" /> Résolu</span>;
      default:
        return null;
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col">
      <div className="flex-1">
        {/* En-tête */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors">
              <Home className="w-4 h-4" />
              Retour à l'accueil
            </Link>
            <div className="flex items-center gap-3">
              <HelpCircle className="w-10 h-10" />
              <div>
                <h1 className="text-4xl font-bold">Aide technique</h1>
                <p className="text-purple-100 mt-2 max-w-2xl">
                  Consultez les problèmes rencontrés par les développeurs et proposez vos solutions.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Filtres et recherche */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 mb-8">
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher par titre, description ou projet..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="open">Ouverts</option>
                <option value="in_progress">En cours</option>
                <option value="resolved">Résolus</option>
              </select>
            </div>
          </div>

          {/* Liste des appels */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Liste */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Appels à solution ({filteredRequests.length})
              </h2>
              
              {paginatedRequests.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-gray-200 dark:border-gray-700">
                  <HelpCircle className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Aucun appel à solution pour le moment</p>
                </div>
              ) : (
                <>
                  {paginatedRequests.map((request) => (
                    <button
                      key={request.id}
                      onClick={() => handleViewRequest(request)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        selectedRequest?.id === request.id
                          ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {request.title}
                            </h3>
                            {getStatusBadge(request.status)}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                            {request.description}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>📁 {request.project_name}</span>
                            <span>📅 {new Date(request.created_at).toLocaleDateString('fr-FR')}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 mt-6">
                      <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page {currentPage} / {totalPages}
                      </span>
                      <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-50"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Détail de l'appel sélectionné */}
            {selectedRequest && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedRequest.title}
                  </h2>
                  <div className="flex items-center gap-3 mt-2">
                    {getStatusBadge(selectedRequest.status)}
                    <span className="text-sm text-gray-500">
                      Projet : {selectedRequest.project_name}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 mt-4 whitespace-pre-wrap">
                    {selectedRequest.description}
                  </p>
                </div>

                {/* Solutions proposées */}
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5" />
                    Solutions proposées ({responses.length})
                  </h3>
                  
                  {responses.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      Aucune solution proposée pour le moment.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {responses.map((response) => (
                        <div key={response.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {response.responder_name}
                            </span>
                            {response.is_accepted && (
                              <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2 py-0.5 rounded-full">
                                ✓ Solution acceptée
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">
                            {response.solution}
                          </p>
                          <p className="text-xs text-gray-400 mt-2">
                            {new Date(response.created_at).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Formulaire de proposition de solution */}
                {selectedRequest.status !== 'resolved' && selectedRequest.status !== 'closed' && (
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      Proposer une solution
                    </h3>
                    <form onSubmit={handleSubmitSolution} className="space-y-4">
                      <textarea
                        value={newSolution}
                        onChange={(e) => setNewSolution(e.target.value)}
                        required
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="Décrivez votre solution de manière détaillée..."
                      />
                      <button
                        type="submit"
                        disabled={submitting || !newSolution.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
                      >
                        {submitting ? 'Envoi...' : 'Proposer la solution'}
                      </button>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}