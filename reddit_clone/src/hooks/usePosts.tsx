import { Post, postState, postVote } from '@/atoms/postsAtom';
import { auth, firestore, storage } from '../firebase/clientApp';
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil';
import { collection, deleteDoc, doc, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { useAuthState } from 'react-firebase-hooks/auth';
import { communityState } from '@/atoms/communitiesAtom';
import { useEffect } from 'react';
import { AuthModalState } from '@/atoms/authModalAtom';
import { useRouter } from 'next/router';

const usePosts = () => {
    const router = useRouter();
    const [user] = useAuthState(auth);
    const [postStateValue, setPostStateValue] = useRecoilState(postState);
    const currentCommunity = useRecoilValue(communityState).currentCommunity;
    const setAuthModalState = useSetRecoilState(AuthModalState);

    const onVote = async (
        event: React.MouseEvent<SVGElement, MouseEvent>,
        post: Post,
        vote: number,
        communityId: string,) => {

        event.stopPropagation();
        // check for a user => if not open auth modal
        if (!user?.uid) {
            setAuthModalState({ open: true, view: "login" });
            return;
        }

        try {
            const { voteStatus } = post;
            const existingVote = postStateValue.postVotes.find(
                (vote) => vote.postId === post.id
            );

            const batch = writeBatch(firestore);
            const updatedPost = { ...post };
            const updatedPosts = [...postStateValue.posts];
            let updatedPostVotes = [...postStateValue.postVotes];
            let voteChange = vote;

            if (!existingVote) {
                //create a new postVote document
                const postVoteRef = doc(
                    collection(firestore, "users", `${user?.uid}/postVotes`)
                );
                const newVote: postVote = {
                    id: postVoteRef.id,
                    postId: post.id!,
                    communityId,
                    voteValue: vote, // 1 or -1
                };

                batch.set(postVoteRef, newVote);

                // add/subtract 1 to/from post.voteStatus
                updatedPost.voteStatus = voteStatus + vote;
                updatedPostVotes = [...updatedPostVotes, newVote];

            }
            //Exisiting vote - they have voted on the post before
            else {
                const postVoteRef = doc(firestore,
                    "users",
                    `${user?.uid}/postVotes/${existingVote.id}`
                );

                //Removing their vote (up => neutral or down => neutral)
                if (existingVote.voteValue === vote) {
                    // add/subtract 1 to/from post.voteStatus
                    updatedPost.voteStatus = voteStatus - vote;
                    updatedPostVotes = updatedPostVotes.filter(
                        (vote) => vote.id !== existingVote.id
                    );

                    //delete the postVote document 
                    batch.delete(postVoteRef);

                    voteChange *= -1;
                }

                // Flipping their vote (up => down or down => up)
                else {
                    // add/subtract 2 to/from post.voteStatus
                    updatedPost.voteStatus = voteStatus + 2 * vote;

                    const voteIdx = postStateValue.postVotes.findIndex(
                        (vote) => vote.id === existingVote.id
                    );

                    updatedPostVotes[voteIdx] = {
                        ...existingVote,
                        voteValue: vote,
                    };

                    //updating the existing postVote document
                    batch.update(postVoteRef, {
                        voteValue: vote,
                    });

                    voteChange = 2 * vote;
                }
            }
            // update state with updated values
            const postIdx = postStateValue.posts.findIndex(
                (item) => item.id === post.id
            );
            updatedPosts[postIdx] = updatedPost;
            setPostStateValue((prev) => ({
                ...prev,
                posts: updatedPosts,
                postVotes: updatedPostVotes,
            }));

            if (postStateValue.selectedPost) {
                setPostStateValue((prev) => ({
                    ...prev, selectedPost: updatedPost,
                }))
            }

            const postRef = doc(firestore, "posts", post.id);
            batch.update(postRef, { voteStatus: voteStatus + voteChange });

            await batch.commit();


        } catch (error: any) {
            console.log("onVote error", error.message)
        }
    };


    const onSelectPost = (post: Post) => {
        setPostStateValue((prev) => ({
            ...prev,
            selectedPost: post,
        }))
        router.push(`/r/${post.communityId}/comments/${post.id}`);
    };

    const onDeletePost = async (post: Post): Promise<boolean> => {
        try {
            //Check if image, delete if exists
            if (post.imageURL) {
                const imageRef = ref(storage, `posts/${post.id}/image`);
                await deleteObject(imageRef);
            }
            // Delete post document from storage
            const postDocRef = doc(firestore, "posts", post.id);
            await deleteDoc(postDocRef);

            // update recoil state
            setPostStateValue((prev) => ({
                ...prev,
                posts: prev.posts.filter((item) => item.id !== post.id)
            }))
            return true;
        } catch (error: any) {
            return false;
        }
    };


    const getCommunityPostVotes = async (communityId: string) => {
        const postVotesQuery = query(
            collection(firestore, "users", `${user?.uid}/postVotes`),
            where("communityId", "==", communityId)
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
    };

    useEffect(() => {
        if (!user || !currentCommunity?.id) return;
        getCommunityPostVotes(currentCommunity?.id);
    }, [user, currentCommunity]);

    useEffect(() => {
        if (!user) {
            // clear user post votes
            setPostStateValue((prev) => ({
                ...prev,
                postVotes: [],
            }));
        }
    }, [user]);
    return {
        postStateValue,
        setPostStateValue,
        onVote,
        onSelectPost,
        onDeletePost,
    };
};

export default usePosts;