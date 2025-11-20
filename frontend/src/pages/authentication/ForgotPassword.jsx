import { useState } from "react";
import * as yup from "yup";
import {
  Alert,
  Button,
  Stack,
  TextField,
  Typography,
  Box,
} from "@mui/material";
import { Email, Update } from "@mui/icons-material";
import AuthLayout from "../../layouts/AuthLayout";

const forgotSchema = yup.object({
  email: yup
    .string()
    .email("Enter a valid email address.")
    .required("Email is required."),
});

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState(null);

  const validateEmail = async (value) => {
    try {
      await forgotSchema.validate({ email: value });
      setError("");
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const isValid = await validateEmail(email);
    if (!isValid) return;

    setSubmitting(true);
    setStatus(null);

    setTimeout(() => {
      setSubmitting(false);
      setStatus("sent");
    }, 1200);
  };

  const handleChange = async (event) => {
    const nextValue = event.target.value;
    setEmail(nextValue);
    await validateEmail(nextValue);
  };

  return (
    <AuthLayout
      title="Reset access link"
      subtitle="Enter the email linked to your auction account. We’ll send a secure recovery link."
      icon={<Update color="primary" fontSize="large" />}
      footerLinks={[
        { label: "Back to login", to: "/login" },
        { label: "Create a new account", to: "/register" },
      ]}
    >
      <Stack component="form" spacing={3} onSubmit={handleSubmit}>
        {status === "sent" && (
          <Alert severity="success">
            We emailed a reset link to {email}. It expires in 15 minutes.
          </Alert>
        )}

        <TextField
          label="Email address"
          type="email"
          value={email}
          onChange={handleChange}
          required
          fullWidth
          error={Boolean(error)}
          helperText={error}
        />

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={submitting}
        >
          {submitting ? "Sending link..." : "Send reset link"}
        </Button>

        <Box
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: "1px dashed",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Email color="primary" />
          <Typography variant="body2" color="text.secondary">
            Check spam folders if you do not see the message. Links only work
            once for security reasons.
          </Typography>
        </Box>
      </Stack>
    </AuthLayout>
  );
};

export default ForgotPassword;