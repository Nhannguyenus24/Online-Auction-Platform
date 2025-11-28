import { useState, useEffect } from "react";
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
import { useAuth } from "../../hooks/useAuth";

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
  const { login, isAuthenticated, isInitialized, user } = useAuth();
  const [formValues, setFormValues] = useState(defaultValues);
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  // Redirect nếu đã đăng nhập
  useEffect(() => {
    if (isInitialized && isAuthenticated && user) {
      const redirectPath =
        user.roleName === "admin"
          ? "/admin/dashboard"
          : user.roleName === "seller"
          ? "/"
          : "/";
      navigate(redirectPath, { replace: true });
    }
  }, [isInitialized, isAuthenticated, user, navigate]);

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

    try {
      // Mock API call - sẽ thay bằng API thật khi backend sẵn sàng
      // Giả lập delay network
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock response data - dựa vào email để phân biệt role (tạm thời)
      // Trong thực tế, backend sẽ trả về user data và accessToken
      const mockUsers = {
        "admin@example.com": {
          id: 1,
          email: "admin@example.com",
          fullName: "Admin User",
          roleName: "admin",
        },
        "seller@example.com": {
          id: 2,
          email: "seller@example.com",
          fullName: "Seller User",
          roleName: "seller",
        },
        "bidder@example.com": {
          id: 3,
          email: "bidder@example.com",
          fullName: "Bidder User",
          roleName: "bidder",
        },
      };

      const userData = mockUsers[formValues.email.toLowerCase()] || {
        id: 3,
        email: formValues.email,
        fullName: "Bidder User",
        roleName: "bidder",
      };

      // Mock accessToken - trong thực tế sẽ nhận từ backend
      const mockAccessToken = `mock_token_${Date.now()}_${userData.id}`;

      // Set user vào context và lưu token
      await login(mockAccessToken, userData);

      // Redirect dựa vào role
      const redirectPath =
        userData.roleName === "admin"
          ? "/admin/dashboard"
          : userData.roleName === "seller"
          ? "/"
          : "/";

      setStatus("success");
      // Redirect ngay lập tức, không cần delay
      navigate(redirectPath, { replace: true });
    } catch (error) {
      console.error("Login error:", error);
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
            Sign-in successful. Redirecting…
          </Alert>
        )}
        {status === "error" && (
          <Alert severity="error" sx={{ py: 1 }}>
            Sign-in failed. Please check your credentials and try again.
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