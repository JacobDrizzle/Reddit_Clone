import { Community } from '../../atoms/communitiesAtom';
import React, { useEffect, useState } from 'react';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { auth, firestore } from '../../firebase/clientApp';
import usePosts from '../../hooks/usePosts';
import { Post } from '../../atoms/postsAtom';
import PostItem from './PostItem';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Stack } from '@chakra-ui/react';
import Loader from './Loader';

type PostsProps = {
    communityData: Community;
};

const Posts: React.FC<PostsProps> = ({ communityData }) => {
    const [user] = useAuthState(auth);
    const [loading, setLoading] = useState(false);
    const {
        postStateValue,
        setPostStateValue,
        onVote,
        onSelectPost,
        onDeletePost,
    } = usePosts();

    //useAuthState

    const getPosts = async () => {
        try {
            setLoading(true);
            // get posts for this community 
            const postsQuery = query(
                collection(firestore, "posts"),
                where("communityId", "==", communityData.id),
                orderBy("createdAt", "desc")
            );
            const postDocs = await getDocs(postsQuery);

            // store in post state
            const posts = postDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

            setPostStateValue((prev) => ({
                ...prev,
                posts: posts as unknown as Post[],
            }));

            console.log("posts", posts);

        } catch (error: any) {
            console.log("getPosts error", error.message);
        }
        setLoading(false);
    };


    useEffect(() => {
        getPosts();
    }, [communityData]);

    return (
        <>
            {loading ? (
                <Loader />
            ) : (
                <Stack>
                    {postStateValue.posts.map((item) => (
                        <PostItem
                            key={item.id}
                            post={item}
                            userIsCreator={user?.uid === item.creatorId}
                            userVoteValue={
                                postStateValue.postVotes.find(
                                    (vote) => vote.postId === item.id)
                                    ?.voteValue
                            }
                            onVote={onVote}
                            onSelectsPost={onSelectPost}
                            onDeletePost={onDeletePost}
                        />
                    ))}
                </Stack>
            )}
        </>
    )
}
export default Posts;