import { View, Text, Alert, TouchableOpacity, TextInput, Image, Switch, ScrollView, StyleSheet, Modal } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { FontAwesome5 } from '@expo/vector-icons';

const POST_TYPES = [
  { label: 'Security Tips', value: 'security tips', icon: 'lightbulb', color: '#4CAF50' },
  { label: 'Questions', value: 'questions', icon: 'question-circle', color: '#2196F3' },
  { label: 'Security Alerts', value: 'security alerts', icon: 'exclamation-triangle', color: '#FF5722' },
  { label: 'Discussion', value: 'discussion', icon: 'comments', color: '#9C27B0' },
];

const AddPost = () => {
  const router = useRouter();
  const { user } = useUser();

  const [description, setDescription] = useState('');
  const [postType, setPostType] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [anonymous, setAnonymous] = useState(false);
  const [dropdownVisible, setDropdownVisible] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const submitPost = async () => {
    if (!description) return Alert.alert('Error', 'Description is required.');
    if (!postType) return Alert.alert('Error', 'Please select a post type.');

    try {
      const post = {
        userId: user?.id,
        description,
        postType,
        image,
        anonymous,
        likes: 0,
        createdAt: new Date().toISOString(),
      };

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.160.116.113:3001';
      const res = await fetch(`${apiUrl}/post`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(post),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Server returned ${res.status}: ${errorText}`);
      }

      Alert.alert('Success', 'Your post has been submitted.');
      router.back();
    } catch (error) {
      console.log('Error:', error);
      Alert.alert('Error', 'Failed to submit post.');
    }
  };

  const selectedPostType = POST_TYPES.find(type => type.value === postType);

  return (
    <LinearGradient
      colors={['#4A0E4E', '#1a0a1d', '#000000']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <FontAwesome5 name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Card Container */}
        <View style={styles.card}>
          {/* Post Type Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Post Type *</Text>
            <TouchableOpacity 
              style={styles.dropdown}
              onPress={() => setDropdownVisible(true)}
            >
              {selectedPostType ? (
                <View style={styles.selectedType}>
                  <FontAwesome5 
                    name={selectedPostType.icon} 
                    size={18} 
                    color={selectedPostType.color} 
                  />
                  <Text style={styles.dropdownText}>{selectedPostType.label}</Text>
                </View>
              ) : (
                <Text style={styles.dropdownPlaceholder}>Select post type</Text>
              )}
              <FontAwesome5 name="chevron-down" size={16} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Description */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              placeholder="Share your thoughts, tips, or concerns..."
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              style={styles.textArea}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* Image Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Add Image (Optional)</Text>
            {image ? (
              <View style={styles.imageContainer}>
                <Image source={{ uri: image }} style={styles.imagePreview} />
                <TouchableOpacity 
                  onPress={() => setImage(null)}
                  style={styles.removeImageButton}
                >
                  <FontAwesome5 name="times" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={pickImage} style={styles.imagePickerButton}>
                <FontAwesome5 name="image" size={24} color="#4A0E4E" />
                <Text style={styles.imagePickerText}>Pick Image from Gallery</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Anonymous Toggle */}
          <View style={styles.anonymousContainer}>
            <View style={styles.anonymousLeft}>
              <FontAwesome5 name="user-secret" size={20} color="#4A0E4E" />
              <View style={styles.anonymousTextContainer}>
                <Text style={styles.anonymousTitle}>Post Anonymously</Text>
                <Text style={styles.anonymousSubtitle}>Your identity will be hidden</Text>
              </View>
            </View>
            <Switch 
              value={anonymous} 
              onValueChange={setAnonymous}
              trackColor={{ false: '#ccc', true: '#4A0E4E' }}
              thumbColor={anonymous ? '#fff' : '#f4f3f4'}
            />
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            onPress={submitPost}
            style={styles.submitButton}
          >
            <LinearGradient
              colors={['#4A0E4E', '#6B1B6F']}
              style={styles.submitGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <FontAwesome5 name="paper-plane" size={18} color="#fff" />
              <Text style={styles.submitText}>Submit Post</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Dropdown Modal */}
      <Modal
        visible={dropdownVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDropdownVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setDropdownVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Post Type</Text>
              <TouchableOpacity onPress={() => setDropdownVisible(false)}>
                <FontAwesome5 name="times" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            
            {POST_TYPES.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.modalOption,
                  postType === type.value && styles.modalOptionSelected
                ]}
                onPress={() => {
                  setPostType(type.value);
                  setDropdownVisible(false);
                }}
              >
                <View style={styles.modalOptionLeft}>
                  <View style={[styles.iconCircle, { backgroundColor: `${type.color}20` }]}>
                    <FontAwesome5 name={type.icon} size={20} color={type.color} />
                  </View>
                  <Text style={styles.modalOptionText}>{type.label}</Text>
                </View>
                {postType === type.value && (
                  <FontAwesome5 name="check" size={18} color="#4A0E4E" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  card: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    minHeight: '100%',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#f9f9f9',
  },
  selectedType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dropdownText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: '#999',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
    minHeight: 120,
    color: '#333',
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#4A0E4E',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 30,
    backgroundColor: '#f9f9f9',
    gap: 10,
  },
  imagePickerText: {
    fontSize: 16,
    color: '#4A0E4E',
    fontWeight: '500',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 12,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    height: 250,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  anonymousContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  anonymousLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  anonymousTextContainer: {
    flex: 1,
  },
  anonymousTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  anonymousSubtitle: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  submitButton: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#4A0E4E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 10,
  },
  submitText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: '#f9f9f9',
  },
  modalOptionSelected: {
    backgroundColor: '#f0e6f1',
    borderWidth: 2,
    borderColor: '#4A0E4E',
  },
  modalOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});

export default AddPost;