import { useRef, useState, useEffect } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Divider,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatListBulleted,
  FormatListNumbered,
  FormatQuote,
  Link,
  Image as ImageIcon,
} from '@mui/icons-material';

const RichTextEditor = ({ value, onChange, onBlur, error, helperText, placeholder, minHeight = 200, disabled = false }) => {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);
  const lastValueRef = useRef(value || '');

  // Set initial value on mount
  useEffect(() => {
    if (editorRef.current && !editorRef.current.innerHTML && value) {
      editorRef.current.innerHTML = value;
      lastValueRef.current = value;
    }
  }, []);

  // Update content only when value changes externally (not from user input)
  useEffect(() => {
    if (editorRef.current && value !== lastValueRef.current && !isFocused) {
      editorRef.current.innerHTML = value || '';
      lastValueRef.current = value || '';
    }
  }, [value, isFocused]);

  const handleInput = () => {
    if (editorRef.current && onChange) {
      const newValue = editorRef.current.innerHTML;
      lastValueRef.current = newValue;
      onChange({
        target: {
          name: 'description',
          value: newValue,
        },
      });
    }
  };

  const execCommand = (command, value = null) => {
    if (disabled) return;
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    // Trigger input event after paste
    setTimeout(() => {
      handleInput();
    }, 0);
  };

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          border: '1px solid',
          borderColor: error ? 'error.main' : isFocused ? 'primary.main' : 'grey.300',
          borderRadius: 1,
          overflow: 'hidden',
          transition: 'all 0.2s',
          opacity: disabled ? 0.6 : 1,
          bgcolor: disabled ? 'grey.50' : 'transparent',
        }}
      >
        {/* Toolbar */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
            p: 1,
            bgcolor: 'grey.50',
            borderBottom: '1px solid',
            borderColor: 'divider',
            flexWrap: 'wrap',
          }}
        >
          <Tooltip title="Bold">
            <IconButton
              size="small"
              onClick={() => execCommand('bold')}
              onMouseDown={(e) => e.preventDefault()}
              disabled={disabled}
            >
              <FormatBold fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Italic">
            <IconButton
              size="small"
              onClick={() => execCommand('italic')}
              onMouseDown={(e) => e.preventDefault()}
              disabled={disabled}
            >
              <FormatItalic fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Underline">
            <IconButton
              size="small"
              onClick={() => execCommand('underline')}
              onMouseDown={(e) => e.preventDefault()}
              disabled={disabled}
            >
              <FormatUnderlined fontSize="small" />
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title="Bullet List">
            <IconButton
              size="small"
              onClick={() => execCommand('insertUnorderedList')}
              onMouseDown={(e) => e.preventDefault()}
              disabled={disabled}
            >
              <FormatListBulleted fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Numbered List">
            <IconButton
              size="small"
              onClick={() => execCommand('insertOrderedList')}
              onMouseDown={(e) => e.preventDefault()}
              disabled={disabled}
            >
              <FormatListNumbered fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Quote">
            <IconButton
              size="small"
              onClick={() => execCommand('formatBlock', 'blockquote')}
              onMouseDown={(e) => e.preventDefault()}
              disabled={disabled}
            >
              <FormatQuote fontSize="small" />
            </IconButton>
          </Tooltip>
          <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />
          <Tooltip title="Insert Link">
            <IconButton
              size="small"
              onClick={() => {
                if (disabled) return;
                const url = prompt('Enter URL:');
                if (url) execCommand('createLink', url);
              }}
              onMouseDown={(e) => e.preventDefault()}
              disabled={disabled}
            >
              <Link fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Editor */}
        <Box
          ref={editorRef}
          contentEditable={!disabled}
          suppressContentEditableWarning
          onInput={handleInput}
          onPaste={disabled ? undefined : handlePaste}
          onFocus={() => !disabled && setIsFocused(true)}
          onBlur={(e) => {
            setIsFocused(false);
            if (onBlur) {
              onBlur(e);
            }
          }}
          sx={{
            minHeight,
            p: 2,
            outline: 'none',
            cursor: disabled ? 'not-allowed' : 'text',
            '&:empty:before': {
              content: `"${placeholder || 'Start typing...'}"`,
              color: 'text.disabled',
            },
            '&:focus': {
              outline: 'none',
            },
            '& p': {
              margin: '0.5em 0',
            },
            '& ul, & ol': {
              marginLeft: '1.5em',
              paddingLeft: '1.5em',
            },
            '& blockquote': {
              borderLeft: '3px solid',
              borderColor: 'primary.main',
              paddingLeft: 2,
              marginLeft: 0,
              fontStyle: 'italic',
              color: 'text.secondary',
            },
          }}
        />
      </Paper>
      {helperText && (
        <Box sx={{ mt: 0.5, px: 1.5 }}>
          <Typography
            variant="caption"
            color={error ? 'error.main' : 'text.secondary'}
          >
            {helperText}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default RichTextEditor;

