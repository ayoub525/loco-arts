import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import api from '../../lib/axios';
import Skeleton from '../../components/ui/Skeleton';
import toast from 'react-hot-toast';

export default function AdminMessages() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: () => api.get('/admin/messages').then(r => r.data),
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => api.patch(`/admin/messages/${id}/read`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      queryClient.invalidateQueries({ queryKey: ['admin-dashboard-counts'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/messages/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-messages'] });
      toast.success('Message supprimé');
    },
  });

  const handleDelete = (id) => {
    if (window.confirm('Supprimer ce message ?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-heading font-black text-3xl">{t('admin.messages')}</h1>
        <p className="text-gray-500 text-sm">Messages reçus depuis le formulaire de contact</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : messages?.length > 0 ? (
        <div className="space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`border p-6 bg-white transition-colors ${
                !m.isRead ? 'border-black shadow-sm' : 'border-gray-200'
              }`}
            >
              <div className="flex flex-wrap justify-between items-center gap-2 mb-3">
                <div className="flex items-center gap-3">
                  <span className="font-heading font-bold text-base">{m.name}</span>
                  {!m.isRead && (
                    <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 uppercase">
                      Nouveau
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400">
                  {new Date(m.createdAt).toLocaleString('fr-TN')}
                </span>
              </div>

              <div className="text-xs text-gray-500 mb-4 space-x-4">
                {m.email && <span>✉️ <a href={`mailto:${m.email}`} className="underline">{m.email}</a></span>}
                {m.phone && <span>📞 <a href={`tel:${m.phone}`} className="underline">{m.phone}</a></span>}
                {m.subject && <span className="font-semibold text-black">Sujet: {m.subject}</span>}
              </div>

              <p className="text-sm text-gray-800 leading-relaxed bg-gray-50 p-4 mb-4 whitespace-pre-wrap">
                {m.body}
              </p>

              <div className="flex justify-end gap-3 text-xs font-heading font-bold">
                {!m.isRead && (
                  <button
                    onClick={() => markReadMutation.mutate(m.id)}
                    className="underline hover:text-gray-600"
                  >
                    ✓ {t('admin.markRead')}
                  </button>
                )}
                <button
                  onClick={() => handleDelete(m.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  {t('admin.delete')}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border border-gray-200 bg-white text-gray-500">
          {t('admin.noMessages')}
        </div>
      )}
    </div>
  );
}
