import { useState } from 'react';
import { Mail, LockKeyhole, Key, ArrowRight, ArrowLeft, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router';
import { Button } from '../../components/ui/Button';
import { FormInput } from '../../components/ui/FormInput';
import { AuthLayout } from './AuthLayout';
import { requestOtp, resetPasswordOtp } from '../../services/authService';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('El correo electrónico es obligatorio.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Ingresa un correo electrónico válido.');
      return;
    }
    try {
      setIsSubmitting(true);
      setError('');
      setMessage('');
      await requestOtp(email, 'PASSWORD_RESET');
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo enviar el código de recuperación.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code) {
      setError('El código de verificación es obligatorio.');
      return;
    }
    if (code.trim().length !== 6) {
      setError('El código debe tener exactamente 6 dígitos.');
      return;
    }
    setIsSubmitting(true);
    setError('');
    setMessage('');
    setTimeout(() => {
      setIsSubmitting(false);
      setStep(3);
    }, 500);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('La nueva contraseña es obligatoria.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    try {
      setIsSubmitting(true);
      setError('');
      setMessage('');
      await resetPasswordOtp(email, code.trim(), password);
      setStep(4);
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo restablecer la contraseña.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    try {
      setIsResending(true);
      setError('');
      setMessage('');
      await requestOtp(email, 'PASSWORD_RESET');
      setMessage('Un nuevo código de recuperación ha sido enviado a tu correo.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo reenviar el código. Intenta de nuevo.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthLayout cardClassName="py-2">
      {step === 1 && (
        <form className="mt-7 space-y-5" onSubmit={handleRequestCode} noValidate>
          <div className="text-center">
            <h2 className="text-3xl font-extrabold leading-tight text-slate-955 dark:text-white xl:text-4xl">
              Recuperar cuenta
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-neutral-400">
              Ingrese el correo electrónico con el que se registró en el sistema
            </p>
          </div>

          <div>
            <FormInput
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
              icon={<Mail className="h-6 w-6 flex-none text-slate-500 dark:text-neutral-300" />}
            />
            <p className="text-xs text-slate-500 dark:text-neutral-450 mt-2 leading-relaxed">
              Le enviaremos un código de recuperación para restablecer su contraseña.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-650 dark:text-red-200">
              {error}
            </div>
          )}

          <Button type="submit" variant="outlineHoverSolid" fullWidth disabled={isSubmitting} className="xl:h-14 xl:text-lg">
            {isSubmitting ? 'Enviando...' : 'Enviar código'}
            <ArrowRight className="h-7 w-7" />
          </Button>

          <div className="mt-6 text-center text-sm font-semibold">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-teal-700 transition hover:text-teal-650 dark:text-teal-300 dark:hover:text-teal-200">
              <ArrowLeft className="h-4 w-4" />
              <span>Volver a iniciar sesión</span>
            </Link>
          </div>
        </form>
      )}

      {step === 2 && (
        <form className="mt-7 space-y-5" onSubmit={handleVerifyCode} noValidate>
          <div className="text-center">
            <h2 className="text-3xl font-extrabold leading-tight text-slate-955 dark:text-white xl:text-4xl">
              Ingresar código
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-neutral-400">
              Escribe el código enviado a <span className="font-bold text-slate-900 dark:text-white">{email}</span>
            </p>
          </div>

          <FormInput
            label="Código de verificación"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Ingresa el código"
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
            {isSubmitting ? 'Verificando...' : 'Verificar código'}
            <ArrowRight className="h-7 w-7" />
          </Button>

          <div className="flex justify-between items-center text-sm font-semibold mt-4">
            <button type="button" onClick={() => setStep(1)} className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-800 dark:text-neutral-300 dark:hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              <span>Cambiar correo</span>
            </button>
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
      )}

      {step === 3 && (
        <form className="mt-7 space-y-5" onSubmit={handleResetPassword} noValidate>
          <div className="text-center">
            <h2 className="text-3xl font-extrabold leading-tight text-slate-955 dark:text-white xl:text-4xl">
              Nueva contraseña
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-neutral-400">
              Ingresa la nueva contraseña para tu cuenta
            </p>
          </div>

          <FormInput
            label="Nueva contraseña"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            icon={<LockKeyhole className="h-6 w-6 flex-none text-slate-500 dark:text-neutral-300" />}
            endIcon={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-white/10"
              >
                {showPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
              </button>
            }
          />

          <FormInput
            label="Confirmar contraseña"
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repite la contraseña"
            icon={<LockKeyhole className="h-6 w-6 flex-none text-slate-500 dark:text-neutral-300" />}
            endIcon={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 dark:text-neutral-300 dark:hover:bg-white/10"
              >
                {showConfirmPassword ? <EyeOff className="h-6 w-6" /> : <Eye className="h-6 w-6" />}
              </button>
            }
          />

          {error && (
            <div className="rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-3 text-sm font-medium text-red-650 dark:text-red-200">
              {error}
            </div>
          )}

          <Button type="submit" variant="outlineHoverSolid" fullWidth disabled={isSubmitting} className="xl:h-14 xl:text-lg">
            {isSubmitting ? 'Actualizando...' : 'Restablecer contraseña'}
            <ArrowRight className="h-7 w-7" />
          </Button>
        </form>
      )}

      {step === 4 && (
        <div className="mt-7 text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <CheckCircle2 className="h-12 w-12" />
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-extrabold leading-tight text-slate-955 dark:text-white xl:text-4xl">
              ¡Contraseña restablecida!
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500 dark:text-neutral-400">
              Tu contraseña ha sido actualizada de forma exitosa.
            </p>
          </div>

          <Button type="button" variant="outlineHoverSolid" fullWidth onClick={() => navigate('/login')} className="xl:h-14 xl:text-lg">
            Ir al inicio de sesión
            <ArrowRight className="h-7 w-7" />
          </Button>
        </div>
      )}
    </AuthLayout>
  );
};
