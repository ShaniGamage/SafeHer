import { View, Text, TouchableOpacity, Image, FlatList, TextInput, ScrollView } from "react-native";
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";

const Community = () => {
  const router = useRouter();
  const user = useUser().user?.id || "";

  type Post = {
    id: number;
    userId: string | null;
    anonymous: boolean;
    description: string;
    image?: string | null;
    likes: number;
    postType?: string;
    createdAt: string;
  };

  const [posts, setPosts] = useState<Post[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("All");
  const [showMyPosts, setShowMyPosts] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<number>>(new Set());

  const postTypes = ["All", "Security tips", "Question", "Security alerts", "Discussion"];

  useEffect(() => {
    fetchPosts();
  }, []);

  useEffect(() => {
    filterPosts();
  }, [posts, searchQuery, selectedFilter, showMyPosts]);

  const fetchPosts = async () => {
    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.12:3001";
      const response = await fetch(`${apiUrl}/post`, {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const result = await response.json();
      setPosts(result.data);
    } catch (err) {
      console.error("Fetch posts error:", err);
    }
  };

  const filterPosts = () => {
    let filtered = [...posts];

    // Filter by "My Posts"
    if (showMyPosts) {
      filtered = filtered.filter((post) => post.userId === user);
    }

    // Filter by post type
    if (selectedFilter !== "All") {
      filtered = filtered.filter(
        (post) => post.postType === selectedFilter
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter((post) =>
        post.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredPosts(filtered);
  };

  const likePost = async (postId: number) => {
    const wasLiked = likedPosts.has(postId);
    const likeDelta = wasLiked ? -1 : 1;

    // Optimistic update
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? { ...post, likes: post.likes + likeDelta }
          : post
      )
    );

    const newLikedPosts = new Set(likedPosts);
    if (wasLiked) {
      newLikedPosts.delete(postId);
    } else {
      newLikedPosts.add(postId);
    }
    setLikedPosts(newLikedPosts);

    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.12:3001";
      const response = await fetch(`${apiUrl}/post/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postId, userId: user }),
      });

      if (!response.ok) throw new Error(`Server returned ${response.status}`);

      const data = await response.json();
      if (data.success) {
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId ? { ...post, likes: data.likes } : post
          )
        );
      }
    } catch (err) {
      // Rollback
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? { ...post, likes: post.likes - likeDelta }
            : post
        )
      );
      setLikedPosts(wasLiked ? new Set([...likedPosts, postId]) : new Set([...likedPosts].filter(id => id !== postId)));
      console.error("Error toggling like:", err);
    }
  };

  const renderPost = ({ item }: { item: Post }) => {
    const isLiked = likedPosts.has(item.id);

    return (
      <View style={{
        backgroundColor: "#fff",
        marginBottom: 1,
        borderBottomWidth: 1,
        borderBottomColor: "#efefef",
      }}>
        {/* Header */}
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          padding: 12,
        }}>
          <View style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: "#e1e1e1",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 10,
          }}>
            <Text style={{ fontSize: 14, fontWeight: "bold" }}>
              {item.anonymous ? "A" : item.userId?.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight: "600", fontSize: 14 }}>
              {item.anonymous ? "Anonymous" : item.userId?.slice(0, 8)}
            </Text>
            {item.postType && (
              <Text style={{ fontSize: 11, color: "#666" }}>
                {item.postType}
              </Text>
            )}
          </View>
          <Text style={{ fontSize: 20 }}>•••</Text>
        </View>

        {/* Image */}
        {item.image && (
          <Image
            source={{ uri: item.image }}
            style={{
              width: "100%",
              height: 400,
              backgroundColor: "#f0f0f0",
            }}
            resizeMode="cover"
          />
        )}

        {/* Actions */}
        <View style={{ padding: 12 }}>
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 8,
          }}>
            <TouchableOpacity
              onPress={() => likePost(item.id)}
              style={{ marginRight: 15 }}
            >
              <Text style={{ fontSize: 24 }}>
                {isLiked ? "❤️" : "🤍"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ marginRight: 15 }}>
              <Text style={{ fontSize: 24 }}>💬</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text style={{ fontSize: 24 }}>📤</Text>
            </TouchableOpacity>
          </View>

          {/* Likes count */}
          <Text style={{ fontWeight: "600", fontSize: 14, marginBottom: 8 }}>
            {item.likes} {item.likes === 1 ? "like" : "likes"}
          </Text>

          {/* Description */}
          <Text style={{ fontSize: 14, lineHeight: 18 }}>
            <Text style={{ fontWeight: "600" }}>
              {item.anonymous ? "Anonymous" : item.userId?.slice(0, 8)}
            </Text>
            {"  "}
            {item.description}
          </Text>

          {/* Timestamp */}
          <Text style={{ fontSize: 11, color: "#999", marginTop: 8 }}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView>
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header */}
      <View style={{
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#efefef",
      }}>
        <View style={{
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",

        }}>
          <Text style={{
            fontSize: 28,
            fontWeight: "bold",
            marginBottom: 5,
          }}>
            Community
          </Text>
          {/* Add Post Button */}
          <TouchableOpacity
            onPress={() => router.push("/addPost")}
            style={{
              padding: 5,
              borderRadius: 8,
              flexDirection: "row",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 18, marginRight: 8 }}>➕</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#f0f0f0",
          borderRadius: 10,
          paddingHorizontal: 12,
          marginBottom: 10,
        }}>
          <Text style={{ fontSize: 16, marginRight: 8 }}>🔍</Text>
          <TextInput
            placeholder="Search posts..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={{
              flex: 1,
              paddingVertical: 10,
              fontSize: 14,
            }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Text style={{ fontSize: 16, color: "#999" }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 0 }}
        >
          {postTypes.map((type) => (
            <TouchableOpacity
              key={type}
              onPress={() => setSelectedFilter(type)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 8,
                backgroundColor: selectedFilter === type ? "#000" : "#f0f0f0",
              }}
            >
              <Text style={{
                fontSize: 13,
                fontWeight: "600",
                color: selectedFilter === type ? "#fff" : "#000",
              }}>
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* My Posts Toggle */}
        <TouchableOpacity
          onPress={() => setShowMyPosts(!showMyPosts)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 10,
            marginBottom: 0,
          }}
        >
          <View style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            borderWidth: 2,
            borderColor: showMyPosts ? "#0095f6" : "#ccc",
            backgroundColor: showMyPosts ? "#0095f6" : "transparent",
            justifyContent: "center",
            alignItems: "center",
            marginRight: 8,
          }}>
            {showMyPosts && (
              <Text style={{ color: "#fff", fontSize: 12, fontWeight: "bold" }}>✓</Text>
            )}
          </View>
          <Text style={{
            fontSize: 14,
            fontWeight: "500",
            color: showMyPosts ? "#0095f6" : "#000",
          }}>
            Show only my posts
          </Text>
        </TouchableOpacity>
      </View>

      {/* Posts List */}
      {filteredPosts.length === 0 ? (
        <View style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          padding: 20,
        }}>
          <Text style={{ fontSize: 48, marginBottom: 10 }}>📭</Text>
          <Text style={{
            fontSize: 16,
            color: "#666",
            textAlign: "center",
          }}>
            {searchQuery || selectedFilter !== "All"
              ? "No posts match your filters"
              : "No posts yet"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredPosts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
    </ScrollView> 
  );
};

export default Community;