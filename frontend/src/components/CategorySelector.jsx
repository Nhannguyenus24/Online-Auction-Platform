import { useState, useEffect } from 'react';
import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Box,
  Typography,
} from '@mui/material';
import { mockGetCategories } from '../mocks';

const CategorySelector = ({ parentCategory, childCategory, onChange, error, helperText }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [availableChildren, setAvailableChildren] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const response = await mockGetCategories();
        setCategories(response.data || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories([]);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (parentCategory && categories.length > 0) {
      const parent = categories.find((cat) => cat.id === parentCategory);
      setAvailableChildren(parent?.children || []);
    } else {
      setAvailableChildren([]);
    }
  }, [parentCategory, categories]);

  const handleParentChange = (event) => {
    const newParentId = event.target.value;
    // Update parent category
    onChange({
      target: {
        name: 'parentCategory',
        value: newParentId,
      },
    });
    // Reset child category when parent changes (trigger validation)
    if (childCategory) {
      onChange({
        target: {
          name: 'childCategory',
          value: '',
        },
      });
    }
  };

  const handleChildChange = (event) => {
    onChange({
      target: {
        name: 'childCategory',
        value: event.target.value,
      },
    });
  };

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Select a category and subcategory for your product.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
        <FormControl fullWidth error={!!error && !parentCategory} required>
          <InputLabel id="parent-category-label">Parent Category</InputLabel>
          <Select
            labelId="parent-category-label"
            id="parent-category"
            value={parentCategory || ''}
            label="Parent Category"
            onChange={handleParentChange}
            disabled={loading}
          >
            <MenuItem value="">
              <em>Select a category</em>
            </MenuItem>
            {categories.map((category) => (
              <MenuItem key={category.id} value={category.id}>
                {category.name}
              </MenuItem>
            ))}
          </Select>
          {error && !parentCategory && <FormHelperText>{error}</FormHelperText>}
        </FormControl>

        <FormControl
          fullWidth
          error={!!error && !childCategory}
          required
          disabled={!parentCategory || availableChildren.length === 0}
        >
          <InputLabel id="child-category-label">Subcategory</InputLabel>
          <Select
            labelId="child-category-label"
            id="child-category"
            value={childCategory || ''}
            label="Subcategory"
            onChange={handleChildChange}
            disabled={!parentCategory || availableChildren.length === 0}
          >
            <MenuItem value="">
              <em>Select a subcategory</em>
            </MenuItem>
            {availableChildren.map((child) => (
              <MenuItem key={child.id} value={child.id}>
                {child.name}
              </MenuItem>
            ))}
          </Select>
          {error && !childCategory && <FormHelperText>{error}</FormHelperText>}
        </FormControl>
      </Box>
      {helperText && !error && (
        <FormHelperText sx={{ mt: 1, ml: 1.5 }}>{helperText}</FormHelperText>
      )}
    </Box>
  );
};

export default CategorySelector;

