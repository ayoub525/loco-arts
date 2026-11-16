import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../../lib/axios';
import toast from 'react-hot-toast';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!token || !email) {
    return (
      <div className="container-custom section-padding max-w-md mx-auto text-center">
        <div className="border border-red-200 bg-red-50 p-6 md:p-8 space-y-4">
          <div className="text-4xl">⚠️</div>
          <h1 className="font-heading font-black text-2xl text-red-900">Lien invalide</h1>
          <p className="text-sm text-red-700">
            Ce lien de réinitialisation est incomplet ou invalide. Veuillez effectuer une nouvelle demande.
          </p>
          <Link to="/mot-de-passe-oublie" className="btn-primary inline-block text-xs py-3 px-6 mt-2">
            Demander un nouveau lien
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Les deux mots de passe ne correspondent pas');
    }
    if (password.length < 6) {
      return toast.error('Le mot de passe doit comporter au moins 6 caractères');
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        token,
        email,
        newPassword: password,
      });
      setSuccess(true);
      toast.success('Mot de passe mis à jour avec succès !');
      setTimeout(() => {
        navigate('/connexion');
      }, 2500);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-custom section-padding max-w-md mx-auto">
      <h1 className="font-heading font-black text-3xl md:text-4xl mb-4 text-center">
        Nouveau mot de passe
      </h1>
      <p className="text-gray-500 text-sm text-center mb-8">
        Compte : <span className="font-semibold text-black">{email}</span>
      </p>

      {success ? (
        <div className="border border-green-200 bg-green-50 p-6 md:p-8 space-y-4 text-center animate-fade-in">
          <div className="text-5xl">✅</div>
          <h2 className="font-heading font-bold text-xl text-green-900">Mot de passe réinitialisé !</h2>
          <p className="text-sm text-green-800">
            Votre nouveau mot de passe a été enregistré avec succès. Redirection vers la page de connexion...
          </p>
          <Link to="/connexion" className="btn-primary inline-block text-xs py-3 px-6 mt-4">
            Se connecter maintenant
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="border border-gray-200 p-6 md:p-8 space-y-4 bg-white">
          <div>
            <label className="block text-sm font-semibold mb-1">Nouveau mot de passe</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Minimum 6 caractères"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">Confirmer le mot de passe</label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Répétez votre nouveau mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:border-black"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 mt-4 text-xs tracking-wider"
          >
            {loading ? 'Modification...' : 'Enregistrer le nouveau mot de passe'}
          </button>
        </form>
      )}
    </div>
  );
}
