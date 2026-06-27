import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div>
            © {new Date().getFullYear()} DevLedger. Tous droits réservés.
          </div>
          <div className="flex gap-6">
            <Link to="/cgu" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              CGU
            </Link>
            <Link to="/confidentialite" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Confidentialité
            </Link>
            <Link to="/mentions-legales" className="hover:text-gray-900 dark:hover:text-white transition-colors">
              Mentions légales
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}