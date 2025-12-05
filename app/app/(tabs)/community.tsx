import { View, Text, TouchableOpacity, Image, FlatList } from "react-native";
import React, { useEffect, useState } from "react";
import { useRouter } from "expo-router";
import { useUser } from "@clerk/clerk-expo";

const Community = () => {
  const router = useRouter();
  const [liked, setLiked] = useState<boolean>(false)
  const [likes, setLikes] = useState<Number>(0)
  const user = useUser().user?.id || "";


  type Post = {
    id: number;
    userId: string | null;
    anonymous: boolean;
    description: string;
    image?: string | null;
    likes: number;
    createdAt: string;
  };
  const [posts, setPosts] = useState<Post[]>([]);


  useEffect(() => {
    (async () => {
      try {
        const apiUrl =
          process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.12:3001";

        const response = await fetch(`${apiUrl}/post`, {
          method: "GET",
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Server error:", errorText);
          throw new Error(`Server returned ${response.status}`);
        }

        const result = await response.json();
        console.log("Fetched posts:", result);

        setPosts(result.data); // save posts
      } catch (err) {
        console.log("Fetch posts error:", err);
      }
    })();
  }, []);

  const likePost = async (postId: number) => {
    // Optimistically update UI
    const wasLiked = liked;
    const likeDelta = wasLiked ? -1 : 1;

    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === postId
          ? { ...post, likes: post.likes + likeDelta }
          : post
      )
    );
    setLiked(!wasLiked);

    try {
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || "http://192.168.1.12:3001";
      const response = await fetch(`${apiUrl}/post/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          postId:postId,
          userId:user
        }), 
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}`);
      }

      const data = await response.json();

      // Update with server's authoritative state
      if (data.success) {
        setPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId
              ? { ...post, likes: data.likes }
              : post
          )
        );
        setLiked(data.liked);
        console.log("Like toggled successfully:", data);
      }
    } catch (err) {
      // Rollback optimistic update on error
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId
            ? { ...post, likes: post.likes - likeDelta }
            : post
        )
      );
      setLiked(wasLiked);
      console.error("Error toggling like:", err);
    }
  };


  const renderItem = ({ item }: { item: Post }) => (
    <View
      style={{
        backgroundColor: "#fff",
        marginBottom: 15,
        padding: 15,
        borderRadius: 10,
        elevation: 2,
      }}
    >
      <Text style={{ fontWeight: "bold", marginBottom: 5 }}>
        {item.anonymous ? "Anonymous" : item.userId?.slice(0, 6)}
      </Text>

      {item.image && (
        <Image
          source={{ uri: item.image }}
          style={{
            width: "100%",
            height: 250,
            borderRadius: 10,
            marginBottom: 10,
          }}
        />
      )}

      <Text style={{ fontSize: 14, marginBottom: 10 }}>
        {item.description}
      </Text>

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TouchableOpacity>
          <Text style={{ fontWeight: "bold" }} onPress={() => likePost(item.id)}>❤️ {item.likes}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );


  return (
    <View style={{ flex: 1, padding: 15 }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", marginBottom: 10 }}>
        Community
      </Text>

      <TouchableOpacity
        onPress={() => router.push("/addPost")}
        style={{
          backgroundColor: "blue",
          padding: 12,
          borderRadius: 10,
          marginBottom: 20,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 16, textAlign: "center" }}>
          ➕ Add Post
        </Text>
      </TouchableOpacity>

      {posts.length === 0 ? (
        <Text style={{ textAlign: "center", marginTop: 30 }}>No posts yet</Text>
      ) : (
        <FlatList
          data={posts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString()}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

export default Community;
