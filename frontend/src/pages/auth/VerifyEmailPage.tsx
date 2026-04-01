// src/pages/auth/VerifyEmailPage.tsx

import { useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ROUTES } from "../../constants/routes";
import {
  useVerifyEmail,
  useResendVerification,
} from "../../hooks/auth/useAuth";
import { getApiErrorMessage } from "../../lib/axios";
import {
  Zap,
  CheckCircle2,
  XCircle,
  Loader2,
  ArrowRight,
  MailOpen,
  RefreshCw,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────
// States
// ─────────────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative w-20 h-20 mb-7">
        <div className="absolute inset-0 rounded-full border-4 border-border" />
        <div className="absolute inset-0 rounded-full border-4 border-t-primary animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <MailOpen size={28} className="text-primary" />
        </div>
      </div>

      <h1 className="font-heading font-extrabold text-2xl text-text-primary mb-2">
        Verifying your email
      </h1>
      <p className="text-sm text-text-muted max-w-xs leading-relaxed">
        Just a moment — we're confirming your email address.
      </p>
    </div>
  );
}

function SuccessState() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="relative w-20 h-20 mb-7">
        <div className="absolute inset-0 rounded-full bg-success/10 animate-ping opacity-40" />
        <div className="relative w-20 h-20 rounded-full bg-success/10 border-2 border-success flex items-center justify-center">
          <CheckCircle2 size={36} className="text-success" />
        </div>
      </div>

      <h1 className="font-heading font-extrabold text-2xl text-text-primary mb-2">
        Email verified!
      </h1>
      <p className="text-sm text-text-muted max-w-xs leading-relaxed mb-8">
        Your email has been confirmed. You can now log in to your StockSense
        account.
      </p>

      <Link to={ROUTES.LOGIN} className="btn btn-primary btn-md w-full">
        Go to login
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
  isRetrying,
  email,
  resendVerification,
}: {
  message: string;
  onRetry: () => void;
  isRetrying: boolean;
  email: string | null;
  resendVerification: ReturnType<typeof useResendVerification>;
}) {
  function handleResend() {
    if (!email) return;
    resendVerification.mutate({ email });
  }

  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-full bg-error/10 border-2 border-error flex items-center justify-center mb-7">
        <XCircle size={36} className="text-error" />
      </div>

      <h1 className="font-heading font-extrabold text-2xl text-text-primary mb-2">
        Verification failed
      </h1>
      <p className="text-sm text-text-muted max-w-xs leading-relaxed mb-2">
        {message}
      </p>
      <p className="text-xs text-text-muted max-w-xs leading-relaxed mb-8">
        The link may have expired or already been used. Request a new one below.
      </p>

      <div className="w-full space-y-3">
        <button
          type="button"
          onClick={onRetry}
          disabled={isRetrying}
          className="btn btn-primary btn-md w-full disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isRetrying ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Retrying…
            </>
          ) : (
            <>
              <RefreshCw size={15} />
              Try again
            </>
          )}
        </button>

        {email && (
          <button
            type="button"
            onClick={handleResend}
            disabled={
              resendVerification.isPending || resendVerification.isSuccess
            }
            className="btn btn-surface btn-md w-full disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {resendVerification.isSuccess ? (
              <>
                <CheckCircle2 size={15} className="text-success" />
                Verification email sent
              </>
            ) : resendVerification.isPending ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Sending…
              </>
            ) : (
              <>
                <MailOpen size={15} />
                Resend verification email
              </>
            )}
          </button>
        )}

        <Link
          to={ROUTES.LOGIN}
          className="btn btn-ghost btn-md w-full text-text-muted"
        >
          Back to login
        </Link>
      </div>
    </div>
  );
}

function MissingTokenState() {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="w-20 h-20 rounded-full bg-warning/10 border-2 border-warning flex items-center justify-center mb-7">
        <XCircle size={36} className="text-warning" />
      </div>

      <h1 className="font-heading font-extrabold text-2xl text-text-primary mb-2">
        Invalid link
      </h1>
      <p className="text-sm text-text-muted max-w-xs leading-relaxed mb-8">
        This verification link is missing a token. Please use the exact link
        from your email, or request a new one.
      </p>

      <Link to={ROUTES.LOGIN} className="btn btn-surface btn-md w-full">
        Back to login
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  // Captured error message — covers both real HTTP errors (isError)
  // and soft failures where apiPost resolves with success: false
  const errorMessage = useRef<string | null>(null);
  // True when server responded with success: false (2xx but logical failure)
  const hasFailed = useRef(false);

  const verifyEmail = useVerifyEmail({
    onSuccess: (res) => {
      if (!res.success) {
        // apiPost resolved but server indicated failure — treat as error
        errorMessage.current = res.message ?? "Verification failed.";
        hasFailed.current = true;
      }
      // If res.success === true, renderBody will show <SuccessState />
      // via the isSuccess && !hasFailed check below
    },
    onError: (err) => {
      errorMessage.current = getApiErrorMessage(err);
    },
    retry: false,
  });

  const resendVerification = useResendVerification();
  const hasMutated = useRef(false);

  useEffect(() => {
    if (!token || hasMutated.current) return;
    hasMutated.current = true;
    verifyEmail.mutate({ token });
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  function retry() {
    if (!token) return;
    hasMutated.current = false;
    hasFailed.current = false;
    errorMessage.current = null;
    verifyEmail.reset();
    setTimeout(() => {
      hasMutated.current = true;
      verifyEmail.mutate({ token });
    }, 0);
  }

  const renderBody = () => {
    if (!token) return <MissingTokenState />;

    // Soft failure: 2xx but success: false
    if (hasFailed.current) {
      return (
        <ErrorState
          message={errorMessage.current ?? "Verification failed."}
          onRetry={retry}
          isRetrying={verifyEmail.isPending}
          email={email}
          resendVerification={resendVerification}
        />
      );
    }

    // Hard failure: axios threw (4xx/5xx)
    if (verifyEmail.isError) {
      return (
        <ErrorState
          message={
            errorMessage.current ?? getApiErrorMessage(verifyEmail.error)
          }
          onRetry={retry}
          isRetrying={verifyEmail.isPending}
          email={email}
          resendVerification={resendVerification}
        />
      );
    }

    // Genuine success
    if (verifyEmail.isSuccess) return <SuccessState />;

    // idle (before effect fires) + pending → spinner
    return <LoadingState />;
  };

  return (
    <div className="min-h-screen bg-bg-base flex flex-col">
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-6 py-5 border-b border-border">
        <Link to="/" className="inline-flex items-center gap-2 select-none">
          <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center">
            <Zap size={15} className="text-white" fill="white" />
          </div>
          <span className="font-heading font-extrabold text-lg tracking-tight text-text-primary">
            Stock<span className="text-primary">Sense</span>
          </span>
        </Link>

        <Link
          to={ROUTES.LOGIN}
          className="text-sm text-text-muted hover:text-text-primary transition-colors duration-150"
        >
          Log in
        </Link>
      </header>

      {/* ── Centered card ── */}
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <div className="w-full max-w-sm bg-bg-surface border border-border rounded-2xl shadow-sm p-8">
          {renderBody()}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="px-6 py-4 border-t border-border">
        <p className="text-xs text-center text-text-muted">
          © {new Date().getFullYear()} StockSense Technologies Ltd. · Made with
          ♥ in UK
        </p>
      </footer>
    </div>
  );
}
