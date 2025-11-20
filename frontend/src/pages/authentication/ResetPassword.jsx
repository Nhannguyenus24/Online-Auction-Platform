import { useMemo, useState } from "react";
import * as yup from "yup";
import {
  Alert,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  TextField,
  IconButton,
  InputAdornment,
  Typography,
} from "@mui/material";
import {
  LockReset,
  CheckCircle,
  RadioButtonUnchecked,
  Visibility,
  VisibilityOff,
} from "@mui/icons-material";
import AuthLayout from "../../layouts/AuthLayout";

const requirements = [
  { label: "At least 8 characters", test: (value) => value.length >= 8 },
  { label: "Contains a letter", test: (value) => /[A-Za-z]/.test(value) },
  { label: "Contains a number", test: (value) => /\d/.test(value) },
];

const resetSchema = yup.object({
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
});

const ResetPassword = () => {
  const [formValues, setFormValues] = useState({
    password: "",
    confirmPassword: "",
  });
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirm: false,
  });
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const meetsRequirement = useMemo(
    () =>
      requirements.reduce((acc, rule) => {
        acc[rule.label] = rule.test(formValues.password);
        return acc;
      }, {}),
    [formValues.password]
  );

  const validateField = async (field, valueOverride) => {
    if (!resetSchema.fields[field]) return;
    try {
      await resetSchema.validateAt(field, {
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
      await resetSchema.validate(formValues, { abortEarly: false });
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
    const { name, value } = event.target;
    setFormValues((prev) => ({
      ...prev,
      [name]: value,
    }));
    await validateField(name, value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const isValid = await validateForm();
    if (!isValid) return;

    setSubmitting(true);
    setStatus(null);

    setTimeout(() => {
      setSubmitting(false);
      setStatus("success");
    }, 1400);
  };

  return (
    <AuthLayout
      title="Create a new password"
      subtitle="Choose a strong password to keep your bidding and payouts secure."
      icon={<LockReset color="primary" fontSize="large" />}
      footerLinks={[{ label: "Back to login", to: "/login" }]}
    >
      <Stack component="form" spacing={3} onSubmit={handleSubmit}>
        {status === "success" && (
          <Alert severity="success">
            Password updated. You can now sign in with the new credentials.
          </Alert>
        )}

        <TextField
          label="New password"
          name="password"
          type={showPassword.password ? "text" : "password"}
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
                  onClick={() =>
                    setShowPassword((prev) => ({
                      ...prev,
                      password: !prev.password,
                    }))
                  }
                >
                  {showPassword.password ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <TextField
          label="Confirm password"
          name="confirmPassword"
          type={showPassword.confirm ? "text" : "password"}
          value={formValues.confirmPassword}
          onChange={handleChange}
          required
          fullWidth
          error={Boolean(formErrors.confirmPassword)}
          helperText={formErrors.confirmPassword}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() =>
                    setShowPassword((prev) => ({
                      ...prev,
                      confirm: !prev.confirm,
                    }))
                  }
                >
                  {showPassword.confirm ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <List dense disablePadding>
          {requirements.map((req) => (
            <ListItem key={req.label} sx={{ py: 0.5 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {meetsRequirement[req.label] ? (
                  <CheckCircle color="success" fontSize="small" />
                ) : (
                  <RadioButtonUnchecked color="disabled" fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText primary={req.label} />
            </ListItem>
          ))}
        </List>

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={submitting}
        >
          {submitting ? "Updating..." : "Update password"}
        </Button>
      </Stack>
    </AuthLayout>
  );
};

export default ResetPassword;