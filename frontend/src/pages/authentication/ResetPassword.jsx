import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { authApi } from "../../utils/api";

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

const defaultValues = {
  password: "",
  confirmPassword: "",
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const [formValues, setFormValues] = useState(defaultValues);
  const [formErrors, setFormErrors] = useState({});
  const [showPassword, setShowPassword] = useState({
    password: false,
    confirm: false,
  });
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

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
      const response = await authApi.changePassword({
        oldPassword: "", // For password reset flow, we might not need old password
        newPassword: formValues.password,
      });

      setSubmitting(false);
      setStatus("success");
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || error.message || "Failed to update password. Please try again.");
      setStatus("error");
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create a new password"
      subtitle="Choose a strong password to keep your bidding and payouts secure."
      icon={<LockReset color="primary" fontSize="large" />}
      footerLinks={[{ label: "Back to login", to: "/login" }]}
    >
      <Stack component="form" spacing={2.5} onSubmit={handleSubmit}>
        {status === "success" && (
          <Alert severity="success" sx={{ py: 1 }}>
            Password updated. You can now sign in with the new credentials.
          </Alert>
        )}
        {status === "error" && (
          <Alert severity="error" sx={{ py: 1 }}>
            {errorMessage}
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
            <ListItem key={req.label} sx={{ py: 0.25 }}>
              <ListItemIcon sx={{ minWidth: 32 }}>
                {meetsRequirement[req.label] ? (
                  <CheckCircle color="success" fontSize="small" />
                ) : (
                  <RadioButtonUnchecked color="disabled" fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText 
                primary={req.label}
                primaryTypographyProps={{ variant: "body2", sx: { fontSize: "0.8rem" } }}
              />
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