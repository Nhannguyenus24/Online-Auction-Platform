import { useMemo, useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import Grid from "@mui/material/Grid";
import {
  Alert,
  Button,
  Stack,
  TextField,
  Typography,
  LinearProgress,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  Box,
} from "@mui/material";
import { VerifiedUser, Google } from "@mui/icons-material";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import AuthLayout from "../../layouts/AuthLayout";
import { authApi } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import ReCaptcha from "../../components/ReCaptcha";

const registerSchema = yup.object({
  firstName: yup.string().required("First name is required."),
  lastName: yup.string().required("Last name is required."),
  email: yup.string().email("Enter a valid email address.").required("Email is required."),
  password: yup
    .string()
    .matches(
      /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,
      "Password must be at least 8 characters and include letters and numbers."
    )
    .required("Password is required."),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password"), null], "Passwords must match.")
    .required("Confirm your password."),
  acceptTerms: yup.boolean().oneOf([true], "You must accept the Terms of Service."),
  recaptcha: yup.string().required("Please complete the reCAPTCHA verification."),
});

const defaultValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
  recaptcha: "",
};

const Register = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(registerSchema),
    defaultValues,
    mode: "onBlur", // Validate on blur instead of onChange for better performance
  });

  const [status, setStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [recaptchaValue, setRecaptchaValue] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const recaptchaRef = useRef(null);

  // OTP verification states
  const [showOTPDialog, setShowOTPDialog] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [registerData, setRegisterData] = useState(null);

  // Watch password for strength calculation
  const password = watch("password");

  const strength = useMemo(() => {
    if (!password) return 0;
    const checks = [password.length >= 8, /[A-Za-z]/.test(password), /\d/.test(password)];
    const passed = checks.filter(Boolean).length;
    return (passed / checks.length) * 100;
  }, [password]);

  const simulateAuth = () => {
    setStatus("success");
    // Show OTP dialog after successful registration
    setShowOTPDialog(true);
    setTimeLeft(300); // Reset timer to 5 minutes
  };

  const handleRecaptchaChange = (value) => {
    setRecaptchaValue(value);
    setValue("recaptcha", value || "", { shouldValidate: true });
  };

  const handleRecaptchaExpired = () => {
    setRecaptchaValue(null);
    setValue("recaptcha", "", { shouldValidate: true });
  };

  const onSubmit = async (data) => {
    setStatus(null);
    setErrorMessage("");

    if (!recaptchaValue) {
      setErrorMessage("Please complete the reCAPTCHA verification.");
      setStatus("error");
      return;
    }

    try {
      const response = await authApi.register({
        email: data.email,
        password: data.password,
        fullName: `${data.firstName} ${data.lastName}`,
        phoneNumber: "",
        address: "",
        recaptchaToken: recaptchaValue,
      });

      setRegisterData(response.data || response);
      simulateAuth();
      // Reset reCAPTCHA on success
      if (recaptchaRef.current?.reset) {
        recaptchaRef.current.reset();
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Registration failed. Please try again."
      );
      setStatus("error");
      // Reset reCAPTCHA on error
      if (recaptchaRef.current?.reset) {
        recaptchaRef.current.reset();
      }
      setRecaptchaValue(null);
      setValue("recaptcha", "", { shouldValidate: true });
    }
  };

  const handleGoogleSignup = async (credentialResponse) => {
    setGoogleLoading(true);
    setErrorMessage("");
    setStatus(null);

    try {
      const response = await authApi.loginWithGoogle({
        googleIdToken: credentialResponse.credential,
      });

      if (response.accessToken) {
        await authLogin(response.accessToken, response.user || null);
        setStatus("success");
        navigate("/");
      } else {
        throw new Error("No access token received from server");
      }
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message ||
          error.message ||
          "Google signup failed. Please try again."
      );
      setStatus("error");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setErrorMessage("Google signup failed. Please try again.");
    setStatus("error");
    setGoogleLoading(false);
  };

  // OTP countdown timer
  useEffect(() => {
    if (!showOTPDialog || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [showOTPDialog, timeLeft]);

  const handleOTPChange = (e) => {
    const value = e.target.value.replace(/\D/g, "").slice(0, 6);
    setOtp(value);
    setOtpError("");
  };

  const handleVerifyOTP = async () => {
    if (otp.length !== 6) {
      setOtpError("OTP must be 6 digits");
      return;
    }

    setOtpSubmitting(true);
    setOtpError("");

    try {
      const response = await authApi.verifyOTP({
        email: registerData?.email,
        otp: otp,
      });

      if (response.data?.success || response.success) {
        setOtpSubmitting(false);
        setShowOTPDialog(false);
        setStatus("otp_verified");
        // Redirect to login after 2 seconds
        setTimeout(() => {
          navigate("/auth/login");
        }, 2000);
      } else {
        setOtpError(response.data?.message || response.message || "Invalid OTP");
        setOtpSubmitting(false);
      }
    } catch (error) {
      setOtpError(
        error.response?.data?.message ||
          error.message ||
          "Failed to verify OTP. Please try again."
      );
      setOtpSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      await authApi.reproduceOTP({
        email: registerData?.email,
      });
      setTimeLeft(300); // Reset timer to 5 minutes
      setOtp("");
      setOtpError("");
    } catch (error) {
      setOtpError(
        error.response?.data?.message ||
          error.message ||
          "Failed to resend OTP. Please try again."
      );
    }
  };

  const handleCloseOTPDialog = () => {
    if (timeLeft > 0) {
      setShowOTPDialog(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Verify sellers faster, manage watchlists, and unlock premium analytics."
      icon={<VerifiedUser color="primary" fontSize="large" />}
      footerLinks={[{ label: "Already have an account? Sign in", to: "/auth/login" }]}
    >
      <Stack component="form" spacing={1.5} onSubmit={handleSubmit(onSubmit)}>
        {status === "success" && (
          <Alert severity="success" sx={{ py: 0.25, mb: 0 }}>
            Check your email to confirm ownership.
          </Alert>
        )}

        {status === "error" && (
          <Alert severity="error" sx={{ py: 0.25, mb: 0 }}>
            {errorMessage}
          </Alert>
        )}

        {status === "otp_verified" && (
          <Alert severity="success" sx={{ py: 0.25, mb: 0 }}>
            Email verified successfully! Redirecting to login...
          </Alert>
        )}

        <Grid container spacing={1}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="First name"
                  required
                  fullWidth
                  size="small"
                  error={Boolean(errors.firstName)}
                  helperText={errors.firstName?.message}
                />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Controller
              name="lastName"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Last name"
                  required
                  fullWidth
                  size="small"
                  error={Boolean(errors.lastName)}
                  helperText={errors.lastName?.message}
                />
              )}
            />
          </Grid>
        </Grid>

        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Business email"
              type="email"
              required
              fullWidth
              size="small"
              error={Boolean(errors.email)}
              helperText={errors.email?.message}
            />
          )}
        />

        <Controller
          name="password"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Password"
              type="password"
              required
              fullWidth
              size="small"
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
            />
          )}
        />

        <Stack spacing={0.25}>
          <LinearProgress
            variant="determinate"
            value={strength}
            sx={{ height: 4, borderRadius: 1 }}
          />
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: "0.65rem", lineHeight: 1.2 }}
          >
            Use at least 8 characters with letters and numbers.
          </Typography>
        </Stack>

        <Controller
          name="confirmPassword"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Confirm password"
              type="password"
              required
              fullWidth
              size="small"
              error={Boolean(errors.confirmPassword)}
              helperText={errors.confirmPassword?.message}
            />
          )}
        />

        <Controller
          name="acceptTerms"
          control={control}
          render={({ field: { value, onChange } }) => (
            <>
              <FormControlLabel
                control={<Checkbox checked={value} onChange={onChange} />}
                label={
                  <Typography variant="caption" sx={{ fontSize: "0.75rem", lineHeight: 1.3 }}>
                    I agree to the{" "}
                    <Button
                      size="small"
                      sx={{ px: 0, fontSize: "0.75rem", py: 0, minWidth: "auto" }}
                      variant="text"
                    >
                      Terms of Service
                    </Button>{" "}
                    and compliance policy.
                  </Typography>
                }
                sx={{ alignItems: "center", mt: -0.5 }}
              />
              {errors.acceptTerms && (
                <Typography variant="caption" color="error" sx={{ mt: -0.5, mb: 0.5 }}>
                  {errors.acceptTerms.message}
                </Typography>
              )}
            </>
          )}
        />

        <ReCaptcha
          onChange={handleRecaptchaChange}
          onExpired={handleRecaptchaExpired}
          resetRef={recaptchaRef}
        />
        {errors.recaptcha && (
          <Alert severity="error" sx={{ py: 0.5, mt: -1 }}>
            {errors.recaptcha.message}
          </Alert>
        )}

        <Button type="submit" variant="contained" size="medium" disabled={isSubmitting || googleLoading}>
          {isSubmitting ? "Creating account..." : "Create account"}
        </Button>

        <Divider sx={{ my: 0.5 }}>or continue with</Divider>

        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            {googleLoading ? (
              <Skeleton variant="rectangular" height={40} width="330px" />
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSignup}
                onError={handleGoogleError}
                width="330"
              />
            )}
          </div>
        </GoogleOAuthProvider>
      </Stack>

      {/* OTP Verification Dialog */}
      <Dialog open={showOTPDialog} onClose={handleCloseOTPDialog} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Verify Your Email
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Enter the 6-digit OTP sent to your email
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              placeholder="000000"
              value={otp}
              onChange={handleOTPChange}
              inputProps={{
                maxLength: 6,
                style: { textAlign: "center", fontSize: "24px", letterSpacing: "8px" },
              }}
              error={Boolean(otpError)}
              helperText={otpError}
              disabled={otpSubmitting || timeLeft <= 0}
            />

            <Box
              sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
            >
              <Typography variant="body2" color={timeLeft <= 60 ? "error" : "text.secondary"}>
                Time remaining: <strong>{formatTime(timeLeft)}</strong>
              </Typography>
              {timeLeft <= 0 && (
                <Button size="small" onClick={handleResendOTP} variant="text">
                  Resend OTP
                </Button>
              )}
            </Box>

            {timeLeft <= 0 && (
              <Alert severity="error">OTP has expired. Please request a new one.</Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Button onClick={handleCloseOTPDialog} disabled={otpSubmitting}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleVerifyOTP}
            disabled={otpSubmitting || otp.length !== 6 || timeLeft <= 0}
            startIcon={otpSubmitting ? <CircularProgress size={20} /> : null}
          >
            {otpSubmitting ? "Verifying..." : "Verify"}
          </Button>
        </DialogActions>
      </Dialog>
    </AuthLayout>
  );
};

export default Register;
