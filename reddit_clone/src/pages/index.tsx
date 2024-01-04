import { Post, postVote } from "@/atoms/postsAtom";
import CreatePostLink from "@/components/Community/CreatePostLink";
import PersonalHome from "@/components/Community/PersonalHome";
import Premium from "@/components/Community/Premium";
import Recommendations from "@/components/Community/Recommendations";
import PageContent from "@/components/Layout/PageContent";
import Loader from "@/components/Posts/Loader";
import PostItem from "@/components/Posts/PostItem";
import { auth, firestore } from "@/firebase/clientApp";
import useCommunityData from "@/hooks/useCommunityData";
import usePosts from "@/hooks/usePosts";
import { Stack } from "@chakra-ui/react";
import { collection, orderBy, query, limit, getDocs, where } from "firebase/firestore";
import type { NextPage } from "next";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";

const Home: NextPage = () => {
  const [loading, setLoading] = useState(false);
  const [user, loadingUser] = useAuthState(auth);
  const { postStateValue, setPostStateValue, onDeletePost, onSelectPost, onVote } = usePosts();
  const { communityStateValue } = useCommunityData();

  const buildUserHomeFeed = async () => {
    setLoading(true);
    try {
      //checking if user belongs to any communities
      if (communityStateValue.mySnippets.length) {

        //get posts from users communitites
        const myCommunityIds = communityStateValue.mySnippets.map(
          (snippet) => snippet.communityId);

        const postQuery = query(
          collection(firestore, "posts"),
          where("communityId", "in", myCommunityIds),
          limit(10)
        );

        const postDocs = await getDocs(postQuery);
        const posts = postDocs.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setPostStateValue((prev) => ({
          ...prev,
          posts: posts as Post[],
        }))

      } else {
        buildNoUserHomeFeed();
      }

    } catch (error: any) {
      console.log("buildUserHomeFeed Error", error.message);
    }
    setLoading(false)
  };

  const buildNoUserHomeFeed = async () => {
    setLoading(true);
    try {
      const postQuery = query(collection(firestore, "posts"),
        orderBy("voteStatus", "desc"),
        limit(10)
      );

      const postDocs = await getDocs(postQuery);

      const posts = postDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      setPostStateValue((prev) => ({
        ...prev,
        posts: posts as Post[],
      }));

    } catch (error: any) {
      console.log("BuildNoUserHomeFeed Error", error.message)
    }
    setLoading(false)

  };

  const getUserPostVotes = async () => {

    try {
      const postIds = postStateValue.posts.map((post) => post.id);
      const postVotesQuery = query(collection
        (firestore, `users/${user?.uid}/postVotes`),
        where("postId", "in", postIds)
      );
      const postVoteDocs = await getDocs(postVotesQuery);
      const postVotes = postVoteDocs.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setPostStateValue((prev) => ({
        ...prev,
        postVotes: postVotes as postVote[],
      }));

    } catch (error: any) {
      console.log("getUserPostVotes error", error.message)
    }
  };

  // Build logged in user home feeed
  useEffect(() => {
    if (communityStateValue.snippetsFetched) buildUserHomeFeed();
  }, [communityStateValue.snippetsFetched])

  // build logged out user homefeed
  useEffect(() => {
    if (!user && !loadingUser) buildNoUserHomeFeed();
  }, [user, loadingUser]);

  // User postVotes effect
  useEffect(() => {
    if (user && postStateValue.posts.length) getUserPostVotes();

    return () => {
      setPostStateValue((prev) => ({
        ...prev,
        postVotes: [],
      }))
    }

  }, [user, postStateValue.posts])


  return (
    <PageContent>
      <>
        <CreatePostLink />
        {loading ? (
          <Loader />
        ) : (
          <Stack>
            {postStateValue.posts.map((post) => (
              <PostItem
                key={post.id}
                post={post}
                onDeletePost={onDeletePost}
                onSelectsPost={onSelectPost}
                onVote={onVote}
                userVoteValue={postStateValue.postVotes.find(
                  (item) => item.postId === post.id
                )?.voteValue}
                userIsCreator={user?.uid === post.creatorId}
                homePage
              />
            ))}
          </Stack>
        )}
      </>

      <>
        <Stack spacing={5}>
          <Recommendations />
          <Premium />
          <PersonalHome />
        </Stack>
      </>
    </PageContent>
  )
};

export default Home;