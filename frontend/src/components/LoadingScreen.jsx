import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';

const LoadingScreen = ({ fullScreen = true }) => {
  // Animation variants for the container
  const containerVariants = {
    initial: { opacity: 0 },
    animate: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.2 }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{
        position: fullScreen ? 'fixed' : 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 9999,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100%',
          width: '100%',
          backgroundColor: 'background.default',
          backdropFilter: 'blur(10px)',
          gap: 0.5,
        }}
      >
        {/* Please wait text */}
        <Typography
          variant="h6"
          sx={{
            color: 'text.primary',
            fontWeight: 500,
          }}
        >
          Please wait
        </Typography>

        {/* Animated dots */}
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'flex-end', height: '32px', pb: 0.5 }}>
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              animate={{
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: index * 0.3,
              }}
            >
              <Typography
                variant="h6"
                sx={{
                  color: 'text.primary',
                  fontWeight: 500,
                  lineHeight: 1,
                }}
              >
                .
              </Typography>
            </motion.div>
          ))}
        </Box>
      </Box>
    </motion.div>
  );
};

export default LoadingScreen;
