import { useState } from 'react';
import PropTypes from 'prop-types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Checkbox,
  FormControlLabel,
  Divider,
  IconButton,
} from '@mui/material';
import { Close, CheckCircle } from '@mui/icons-material';

const ConsentDialog = ({
  open,
  onClose,
  onAccept,
  onDecline,
  title = 'User Consent',
  content,
  acceptText = 'I Accept',
  declineText = 'Decline',
  requireCheckbox = true,
  checkboxLabel = 'I have read and agree to the terms',
  maxWidth = 'sm',
  showCloseButton = true,
}) => {
  const [checked, setChecked] = useState(false);

  const handleAccept = () => {
    if (requireCheckbox && !checked) return;
    setChecked(false);
    onAccept();
  };

  const handleDecline = () => {
    setChecked(false);
    if (onDecline) {
      onDecline();
    } else {
      onClose();
    }
  };

  const handleClose = () => {
    if (showCloseButton) {
      setChecked(false);
      onClose();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth={maxWidth}
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          pb: 2,
        }}
      >
        <Typography variant="h6" fontWeight="bold">
          {title}
        </Typography>
        {showCloseButton && (
          <IconButton
            aria-label="close"
            onClick={handleClose}
            size="small"
            sx={{
              color: 'text.secondary',
            }}
          >
            <Close />
          </IconButton>
        )}
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ py: 3 }}>
        <Box
          sx={{
            maxHeight: 400,
            overflowY: 'auto',
            pr: 1,
            '&::-webkit-scrollbar': {
              width: '8px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'grey.100',
              borderRadius: 1,
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'grey.400',
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'grey.500',
              },
            },
          }}
        >
          {typeof content === 'string' ? (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                whiteSpace: 'pre-line',
                lineHeight: 1.8,
              }}
            >
              {content}
            </Typography>
          ) : (
            content
          )}
        </Box>

        {requireCheckbox && (
          <FormControlLabel
            control={
              <Checkbox
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Typography variant="body2" color="text.secondary">
                {checkboxLabel}
              </Typography>
            }
            sx={{ mt: 2, ml: 0 }}
          />
        )}
      </DialogContent>

      <Divider />

      <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
        {onDecline && (
          <Button onClick={handleDecline} color="inherit">
            {declineText}
          </Button>
        )}
        <Button
          variant="contained"
          onClick={handleAccept}
          disabled={requireCheckbox && !checked}
          startIcon={<CheckCircle />}
          sx={{ minWidth: 120 }}
        >
          {acceptText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

ConsentDialog.propTypes = {
  open: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onAccept: PropTypes.func.isRequired,
  onDecline: PropTypes.func,
  title: PropTypes.string,
  content: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
  acceptText: PropTypes.string,
  declineText: PropTypes.string,
  requireCheckbox: PropTypes.bool,
  checkboxLabel: PropTypes.string,
  maxWidth: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  showCloseButton: PropTypes.bool,
};

export default ConsentDialog;
