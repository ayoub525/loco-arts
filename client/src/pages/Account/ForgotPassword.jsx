import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [sentMessage, setSentMessage] = useState('');
  const [devResetUrl, setDevResetUrl] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setDevResetUrl('');
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSent(true);
      setSentMessage(res.data.message || 'Email envoyé avec succès');
      if (res.data.resetUrl) {
        setDevResetUrl(res.data.resetUrl);
      }
      toast.success('Email de réinitialisation envoyé !');
    } catch (err) {
      toast.error(err.response?.data?.error || "Erreur lors de l'envoi de l'email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-custom section-padding max-w-md mx-auto">
      <h1 className="font-heading font-black text-3xl md:text-4xl mb-4 text-center">
        Mot de passe oublié
      </h1>
      <p className="text-gray-500 text-sm text-center mb-8">
        Entrez votre adresse email ci-dessous. Nous vous enverrons un lien sécurisé pour créer un nouveau mot de passe.
      </p>

      {sent ? (
        <div className="border border-gray-200 p-6 md:p-8 space-y-6 bg-white text-center animate-fade-in">
          <div className="text-5xl">✉️</div>
          <h2 className="font-heading font-bold text-lg">Email envoyé !</h2>
          <p className="text-sm text-gray-600 leading-relaxed">
            {sentMessage}
          </p>
          <p className="text-xs text-gray-400">
            Pensez à vérifier vos courriers indésirables (spams) si vous ne trouvez pas l'email dans votre boîte de réception.
          </p>

          {devResetUrl && (
            <div className="bg-gray-50 p-4 border border-gray-200 text-left text-xs break-all">
              <span className="font-bold block text-gray-500 mb-1">Lien direct de réinitialisation :</span>
              <a href={devResetUrl} className="text-black underline font-semibold">
                {devResetUrl}
              </a>
            </div>
          )}

          <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
            <button
              onClick={() => { setSent(false); setEmail(''); }}
              className="text-xs underline text-gray-500 hover:text-black font-heading font-bold uppercase"
            >
              Renvoyer avec une autre adresse
            </button>
            <Link to="/connexion" className="btn-primary w-full py-3 mt-2 text-center text-xs">
              Retour à la connexion
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="border border-gray-200 p-6 md:p-8 space-y-4 bg-white">
          <div>
            <label className="block text-sm font-semibold mb-1">Votre adresse email</label>
            <input
              type="email"
              required
              placeholder="ex: ayoubferchichi88@gmail.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 mt-4 text-xs tracking-wider"
          >
            {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
          </button>

          <div className="text-center pt-4 border-t border-gray-100">
            <Link to="/connexion" className="text-xs font-heading font-bold uppercase text-gray-500 hover:text-black">
              ← Retour à la connexion
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
