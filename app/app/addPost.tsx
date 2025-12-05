import { View, Text, Alert, TouchableOpacity, TextInput, Image, Switch, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import * as ImagePicker from 'expo-image-picker';

const AddPost = () => {
  const router = useRouter();
  const { user } = useUser();

  const [description, setDescription] = useState('');
  const [postType, setPostType] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [anonymous, setAnonymous] = useState(false);

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

      const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.43.31:3001';
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

  

  return (
    <ScrollView style={{ padding: 20 }}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={{ color: 'blue', marginTop: 80 }}>Go back</Text>
      </TouchableOpacity>

      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 10 }}>Add Post</Text>

      <TextInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 10 }}
      />

      <TextInput
        placeholder="Type of post (safety tip, safety alert)"
        value={postType}
        onChangeText={setPostType}
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 10, borderRadius: 8, marginBottom: 10 }}
      />

      <TouchableOpacity onPress={pickImage} style={{ marginBottom: 10 }}>
        <Text>🖼️ Pick Image from Gallery</Text>
      </TouchableOpacity>

      {image && (
        <View style={{ marginBottom: 10 }}>
          <Image source={{ uri: image }} style={{ width: 200, height: 200, borderRadius: 8 }} />
          <TouchableOpacity onPress={() => setImage(null)}>
            <Text style={{ color: 'red', marginTop: 5 }}>✕ Remove</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
        <Switch value={anonymous} onValueChange={setAnonymous} />
        <Text style={{ marginLeft: 8 }}>Post Anonymously</Text>
      </View>

      <TouchableOpacity
        onPress={submitPost}
        style={{ backgroundColor: '#007AFF', padding: 12, borderRadius: 8 }}
      >
        <Text style={{ color: 'white', textAlign: 'center', fontWeight: '600' }}>Submit Post</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default AddPost;
