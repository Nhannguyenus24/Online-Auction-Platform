import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import {
  Alert,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  CircularProgress,
} from "@mui/material";
import { Gavel, Google, Visibility, VisibilityOff } from "@mui/icons-material";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import AuthLayout from "../../layouts/AuthLayout";
import { authApi } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";
import ReCaptcha from "../../components/ReCaptcha";

const loginSchema = yup.object({
  email: yup.string().email("Enter a valid email address.").required("Email is required."),
  password: yup.string().required("Password is required."),
  remember: yup.boolean(),
  recaptcha: yup.string().required("Please complete the reCAPTCHA verification."),
});

const defaultValues = { email: "", password: "", remember: true, recaptcha: "" };

const Login = () => {
  const navigate = useNavigate();
  const { login: authLogin } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [recaptchaValue, setRecaptchaValue] = useState(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const recaptchaRef = useRef(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(loginSchema),
    defaultValues,
    mode: "onBlur",
  });

  const handleRecaptchaChange = (value) => {
    setRecaptchaValue(value);
    setValue("recaptcha", value || "", { shouldValidate: true });
  };

  const handleRecaptchaExpired = () => {
    setRecaptchaValue(null);
    setValue("recaptcha", "", { shouldValidate: true });
  };

  const handleGoogleSuccess = async (credentialResponse) => {
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
          "Google login failed. Please try again."
      );
      setStatus("error");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleError = () => {
    setErrorMessage("Google login failed. Please try again.");
    setStatus("error");
    setGoogleLoading(false);
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
      const response = await authApi.login({
        email: data.email,
        password: data.password,
        recaptchaToken: recaptchaValue,
      });

      // Update auth context with user data
      if (response.accessToken) {
        // If user data is provided, use it; otherwise login function will try to get from token
        await authLogin(response.accessToken, response.user || null);
      } else {
        throw new Error('No access token received from server');
      }

      setStatus("success");

      // Reset reCAPTCHA
      if (recaptchaRef.current?.reset) {
        recaptchaRef.current.reset();
      }

        navigate("/");
    } catch (error) {
      setErrorMessage(
        error.response?.data?.message || error.message || "Login failed. Please try again."
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

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to monitor bids, manage listings, and access real-time insights."
      icon={<Gavel color="primary" fontSize="large" />}
      footerLinks={[
        { label: "Forgot password?", to: "/auth/forgot-password" },
        { label: "Create account", to: "/auth/register" },
      ]}
    >
      <Stack component="form" spacing={2.5} onSubmit={handleSubmit(onSubmit)}>
        {status === "success" && (
          <Alert severity="success" sx={{ py: 1 }}>
            Sign-in successful. Redirecting to dashboard…
          </Alert>
        )}
        {status === "error" && (
          <Alert severity="error" sx={{ py: 1 }}>
            {errorMessage}
          </Alert>
        )}

        <Controller
          name="email"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label="Email address"
              type="email"
              required
              fullWidth
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
              type={showPassword ? "text" : "password"}
              required
              fullWidth
              error={Boolean(errors.password)}
              helperText={errors.password?.message}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword((prev) => !prev)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          )}
        />

        <Controller
          name="remember"
          control={control}
          render={({ field: { value, onChange } }) => (
            <FormControlLabel
              control={<Checkbox checked={value} onChange={onChange} />}
              label="Keep me signed in"
            />
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

        <Button type="submit" variant="contained" size="large" disabled={isSubmitting}>
          {isSubmitting ? "Signing in..." : "Sign in"}
        </Button>

        <Divider>or continue with</Divider>

        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            {googleLoading ? (
              <CircularProgress />
            ) : (
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                width="330"
              />
            )}
          </div>
        </GoogleOAuthProvider>
      </Stack>
    </AuthLayout>
  );
};

export default Login;
