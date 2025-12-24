import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
} from "@mui/material";
import {
  Gavel,
  Google,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import AuthLayout from "../../layouts/AuthLayout";
import { authApi } from "../../utils/api";

const loginSchema = yup.object({
  email: yup
    .string()
    .email("Enter a valid email address.")
    .required("Email is required."),
  password: yup
    .string()
    .matches(
      /^(?=.*[A-Za-z])(?=.*\d).{8,}$/,
      "Password must be at least 8 characters and include letters and numbers."
    )
    .required("Password is required."),
  remember: yup.boolean(),
});

const defaultValues = { email: "", password: "", remember: true };

const Login = () => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(defaultValues);
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const validateField = async (field, valueOverride) => {
    if (!loginSchema.fields[field]) return;
    try {
      await loginSchema.validateAt(field, {
        ...formValues,
        [field]: valueOverride ?? formValues[field],
      });
      setFormErrors((prev) => ({ ...prev, [field]: "" }));
    } catch (error) {
      setFormErrors((prev) => ({ ...prev, [field]: error.message }));
    }
  };

  const validateForm = async () => {
    try {
      await loginSchema.validate(formValues, { abortEarly: false });
      setFormErrors({});
      return true;
    } catch (error) {
      const formattedErrors = error.inner.reduce((acc, current) => {
        if (current.path && !acc[current.path]) {
          acc[current.path] = current.message;
        }
        return acc;
      }, {});
      setFormErrors((prev) => ({ ...prev, ...formattedErrors }));
      return false;
    }
  };

  const handleChange = async (event) => {
    const { name, value, checked, type } = event.target;
    const nextValue = type === "checkbox" ? checked : value;
    setFormValues((prev) => ({ ...prev, [name]: nextValue }));
    await validateField(name, nextValue);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const isValid = await validateForm();
    if (!isValid) return;

    setSubmitting(true);
    setStatus(null);
    setErrorMessage("");

    try {
      const response = await authApi.login({
        email: formValues.email,
        password: formValues.password,
      });

      setStatus("success");
      setSubmitting(false);
      
      // Redirect to dashboard after 1 second
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || "Login failed. Please try again.");
      setStatus("error");
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to monitor bids, manage listings, and access real-time insights."
      icon={<Gavel color="primary" fontSize="large" />}
      footerLinks={[
        { label: "Forgot password?", to: "/forgot-password" },
        { label: "Create account", to: "/register" },
      ]}
    >
      <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
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

        <TextField
          label="Email address"
          name="email"
          type="email"
          value={formValues.email}
          onChange={handleChange}
          required
          fullWidth
          error={Boolean(formErrors.email)}
          helperText={formErrors.email}
        />

        <TextField
          label="Password"
          name="password"
          type={showPassword ? "text" : "password"}
          value={formValues.password}
          onChange={handleChange}
          required
          fullWidth
          error={Boolean(formErrors.password)}
          helperText={formErrors.password}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <FormControlLabel
          control={
            <Checkbox
              checked={formValues.remember}
              name="remember"
              onChange={handleChange}
            />
          }
          label="Keep me signed in"
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={submitting}
        >
          {submitting ? "Signing in..." : "Sign in"}
        </Button>

        <Divider>or continue with</Divider>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Button startIcon={<Google />} variant="outlined" fullWidth>
            Google
          </Button>
        </Stack>
      </Stack>
    </AuthLayout>
  );
};

export default Login;