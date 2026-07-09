import { useState, useEffect } from 'react';
import { Key, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLocation, useNavigate, Link } from 'react-router';
import { Button } from '../../components/ui/Button';
import { FormInput } from '../../components/ui/FormInput';
import { AuthLayout } from './AuthLayout';
import { verifyAccountOtp, requestOtp, roleHomeRoutes, saveSession, normalizeBackendUser } from '../../services/authService';
import { getStoredSession } from '../../services/session';
import { updateUser } from '../../services/usersService';

export const VerifyAccountPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const session = getStoredSession();
  const email = location.state?.email || session?.user?.email || '';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (session?.user?.isVerified) {
      navigate(roleHomeRoutes[session.user.role]);
    }
  }, [session, navigate]);

  const maskEmail = (emailStr: string) => {
    if (!emailStr) return '';
    const [local, domain] = emailStr.split('@');
    if (!domain) return emailStr;
    const visible = local.substring(0, Math.min(3, local.length));
    return `${visible}${'*'.repeat(Math.max(0, local.length - 3))}@${domain}`;
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      setError('El código de verificación es obligatorio.');
      return;
    }
    if (code.trim().length !== 6) {
      setError('El código debe tener exactamente 6 dígitos.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');
      setMessage('');

      const newSession = await verifyAccountOtp(email, code.trim());
      saveSession(newSession);

      const state = location.state || {};
      if (state.firstName?.trim() || state.lastName?.trim() || state.phone?.trim()) {
        try {
          const updatedUser = await updateUser('me', {
            firstName: state.firstName?.trim() || undefined,
            lastName: state.lastName?.trim() || undefined,
            phone: state.phone?.trim() || undefined,
          });
          saveSession({
            accessToken: newSession.accessToken,
            user: normalizeBackendUser(updatedUser),
          });
        } catch (profileError) {
          console.error('Error al actualizar datos de perfil tras verificacion:', profileError);
        }
      }

      setMessage('Cuenta verificada exitosamente.');
      setTimeout(() => {
        navigate(roleHomeRoutes[newSession.user.role]);
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Código de verificación inválido o expirado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    try {
      setIsResending(true);
      setError('');
      setMessage('');
      await requestOtp(email, 'ACCOUNT_VERIFICATION');
      setMessage('Un nuevo código de verificación ha sido enviado a tu correo.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo reenviar el código. Intenta de nuevo.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout cardClassName="py-2">
      <form className="mt-7 space-y-5" onSubmit={handleVerify}>
        <div className="text-center">
          <h2 className="text-3xl font-extrabold leading-tight text-slate-955 dark:text-white">
            Verificar cuenta
          </h2>
          <p className="mt-2 text-sm font-medium text-slate-500 dark:text-neutral-400 leading-relaxed">
            Hemos enviado un código de verificación a: <br />
            <span className="font-bold text-slate-900 dark:text-white">{maskEmail(email)}</span>
          </p>
        </div>

        <FormInput
          label="Código de verificación (6 dígitos)"
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Escribe el código"
          maxLength={6}
          icon={<Key className="h-6 w-6 flex-none text-slate-500 dark:text-neutral-300" />}
        />

        {error && (
          <div className="rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-650 dark:text-red-200">
            {error}
          </div>
        )}

        {message && (
          <div className="rounded-lg border border-emerald-400/40 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-650 dark:text-emerald-350">
            {message}
          </div>
        )}

        <Button type="submit" variant="outlineHoverSolid" fullWidth disabled={isSubmitting} className="xl:h-14 xl:text-lg">
          {isSubmitting ? 'Verificando...' : 'Verificar cuenta'}
          <ArrowRight className="h-7 w-7" />
        </Button>

        <div className="flex justify-between items-center text-sm font-semibold mt-4">
          <Link to="/login" className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-800 dark:text-neutral-300 dark:hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            <span>Cancelar</span>
          </Link>
          <button
            type="button"
            onClick={() => void handleResend()}
            disabled={isResending}
            className="text-teal-700 hover:text-teal-650 dark:text-teal-300 dark:hover:text-teal-200 disabled:opacity-50"
          >
            {isResending ? 'Reenviando...' : 'Reenviar código'}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};
