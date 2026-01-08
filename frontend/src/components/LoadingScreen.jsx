import { Box, Skeleton } from '@mui/material';
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

  // Jumping dots animation
  const dotVariants = {
    jump: {
      y: [0, -20, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: 'easeInOut',
      }
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
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100%',
          width: '100%',
          backgroundColor: 'background.default',
          backdropFilter: 'blur(10px)',
          gap: 3,
          padding: 2,
        }}
      >
        {/* Skeleton loading cards */}
        <Box sx={{ width: '100%', maxWidth: 600, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {[1, 2, 3].map((item) => (
            <Box key={item} sx={{ width: '100%' }}>
              <Skeleton variant="rectangular" height={100} sx={{ borderRadius: 1, mb: 1 }} />
              <Skeleton variant="text" width="80%" height={24} sx={{ borderRadius: 0.5 }} />
            </Box>
          ))}
        </Box>

        {/* Jumping dots animation */}
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', justifyContent: 'center' }}>
          {[0, 1, 2].map((index) => (
            <motion.div
              key={index}
              variants={dotVariants}
              animate="jump"
              transition={{
                delay: index * 0.1,
              }}
            >
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  backgroundColor: 'primary.main',
                }}
              />
            </motion.div>
          ))}
        </Box>
      </Box>
    </motion.div>
  );
};

export default LoadingScreen;
