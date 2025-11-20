import { useMemo, useState } from "react";
import * as yup from "yup";
import Grid from "@mui/material/Grid";
import {
  Alert,
  Button,
  Stack,
  TextField,
  Typography,
  LinearProgress,
  Checkbox,
  FormControlLabel,
  Divider,
} from "@mui/material";
import { VerifiedUser, Google } from "@mui/icons-material";
import AuthLayout from "../../layouts/AuthLayout";

const registerSchema = yup.object({
  firstName: yup.string().required("First name is required."),
  lastName: yup.string().required("Last name is required."),
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
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password"), null], "Passwords must match.")
    .required("Confirm your password."),
  acceptTerms: yup
    .boolean()
    .oneOf([true], "You must accept the Terms of Service."),
});

const defaultValues = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  acceptTerms: false,
};

const Register = () => {
  const [formValues, setFormValues] = useState(defaultValues);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  const strength = useMemo(() => {
    if (!formValues.password) return 0;
    const checks = [
      formValues.password.length >= 8,
      /[A-Za-z]/.test(formValues.password),
      /\d/.test(formValues.password),
    ];
    const passed = checks.filter(Boolean).length;
    return (passed / checks.length) * 100;
  }, [formValues.password]);

  const validateField = async (field, valueOverride) => {
    if (!registerSchema.fields[field]) return;
    try {
      await registerSchema.validateAt(field, {
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
      await registerSchema.validate(formValues, { abortEarly: false });
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

    setFormValues((prev) => ({
      ...prev,
      [name]: nextValue,
    }));

    await validateField(name, nextValue);
  };

  const simulateAuth = () => {
    setSubmitting(true);
    setStatus(null);

    setTimeout(() => {
      setSubmitting(false);
      setStatus("success");
    }, 1400);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const isValid = await validateForm();
    if (!isValid) return;
    simulateAuth();
  };

  const handleGoogleSignup = () => {
    simulateAuth();
  };

  return (
    <AuthLayout
      title="Create an account"
      subtitle="Verify sellers faster, manage watchlists, and unlock premium analytics."
      icon={<VerifiedUser color="primary" fontSize="large" />}
      footerLinks={[
        { label: "Already have an account? Sign in", to: "/login" },
      ]}
    >
      <Stack component="form" spacing={3} onSubmit={handleSubmit}>
        {status === "success" && (
          <Alert severity="success">
            Registration successful. Check your email to confirm ownership.
          </Alert>
        )}

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="First name"
              name="firstName"
              value={formValues.firstName}
              onChange={handleChange}
              required
              fullWidth
              error={Boolean(formErrors.firstName)}
              helperText={formErrors.firstName}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              label="Last name"
              name="lastName"
              value={formValues.lastName}
              onChange={handleChange}
              required
              fullWidth
              error={Boolean(formErrors.lastName)}
              helperText={formErrors.lastName}
            />
          </Grid>
        </Grid>

        <TextField
          label="Business email"
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
          type="password"
          value={formValues.password}
          onChange={handleChange}
          required
          fullWidth
          error={Boolean(formErrors.password)}
          helperText={formErrors.password}
        />

        <Stack spacing={1}>
          <LinearProgress
            variant="determinate"
            value={strength}
            sx={{ height: 8, borderRadius: 1 }}
          />
          <Typography variant="caption" color="text.secondary">
            Use at least 8 characters with letters and numbers.
          </Typography>
        </Stack>

        <TextField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          value={formValues.confirmPassword}
          onChange={handleChange}
          required
          fullWidth
          error={Boolean(formErrors.confirmPassword)}
          helperText={formErrors.confirmPassword}
        />

        <FormControlLabel
          control={
            <Checkbox
              name="acceptTerms"
              checked={formValues.acceptTerms}
              onChange={handleChange}
            />
          }
          label={
            <Typography variant="body2">
              I agree to the{" "}
              <Button size="small" sx={{ px: 0 }} variant="text">
                Terms of Service
              </Button>{" "}
              and compliance policy.
            </Typography>
          }
        />
        {formErrors.acceptTerms && (
          <Typography variant="caption" color="error">
            {formErrors.acceptTerms}
          </Typography>
        )}

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={submitting}
        >
          {submitting ? "Creating account..." : "Create account"}
        </Button>

        <Divider>or continue with</Divider>

        <Button
          startIcon={<Google />}
          variant="outlined"
          size="large"
          fullWidth
          onClick={handleGoogleSignup}
          disabled={submitting}
        >
          Sign up with Google
        </Button>
      </Stack>
    </AuthLayout>
  );
};

export default Register;