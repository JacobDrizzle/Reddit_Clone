import { Community, CommunitySnippet, communityState } from '../atoms/communitiesAtom';
import React, { useEffect, useState } from 'react';
import { useRecoilState, useSetRecoilState } from 'recoil';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, firestore } from '../firebase/clientApp';
import { getDocs, collection, writeBatch, doc, increment, getDoc } from 'firebase/firestore';
import { AuthModalState } from '@/atoms/authModalAtom';
import { useRouter } from 'next/router';

const useCommunityData = () => {
    const [user] = useAuthState(auth);
    const router = useRouter();
    const [communityStateValue, setCommunityStateValue] =
        useRecoilState(communityState);
    const setAuthModalState = useSetRecoilState(AuthModalState)
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const onJoinOrLeaveCommunity = (
        communityData: Community,
        isJoined: boolean
    ) => {
        // is the user signed in?
        // if not => open auth modal
        if (!user) {
            setAuthModalState({ open: true, view: "login" });
            return;
        }

        setLoading(true);
        if (isJoined) {
            leaveCommunity(communityData.id);
            return;
        }
        joinCommunity(communityData);
    };

    const getMySnippets = async () => {
        setLoading(true);
        try {
            //get users snippets
            const snippetDocs = await getDocs(
                collection(firestore, `users/${user?.uid}/communitySnippets`)
            );

            const snippets = snippetDocs.docs.map((doc) => ({ ...doc.data() }));
            setCommunityStateValue((prev) => ({
                ...prev,
                mySnippets: snippets as CommunitySnippet[],
                snippetsFetched: true,
            }));

            console.log("here are my snippets", snippets)
        } catch (error: any) {
            console.log("getMySnippet error", error);
            setError(error.message);
        }
        setLoading(false);
    };

    const joinCommunity = async (communityData: Community) => {
        // Batch write

        try {
            const batch = writeBatch(firestore);

            // Creating a new community snippet
            const newSnippet: CommunitySnippet = {
                communityId: communityData.id,
                imageURL: communityData.imageURL || "",
                isModerator: user?.uid === communityData.creatorId,
            };

            batch.set(
                doc(
                    firestore, `users/${user?.uid}/communitySnippets`, communityData.id
                ),
                newSnippet
            );

            // Updateing the numberOfMembers (+1)
            batch.update(doc(firestore, "communities", communityData.id), {
                numberOfMembers: increment(1),
            });

            await batch.commit();

            // update recoil state - communityState.mySnippets

            setCommunityStateValue((prev) => ({
                ...prev,
                mySnippets: [...prev.mySnippets, newSnippet],
            }));

        } catch (error: any) {
            console.log("joinCommunity error", error);
            setError(error.message);
        }
        setLoading(false);
    };

    const leaveCommunity = async (communityId: string) => {
        // Batch write
        try {
            const batch = writeBatch(firestore);

            // Deleting the community snippet from user
            batch.delete(doc(firestore, `users/${user?.uid}/communitySnippets`, communityId)
            );
            // Updateing the numberOfMembers (-1)
            batch.update(doc(firestore, "communities", communityId), {
                numberOfMembers: increment(-1),
            });

            // update recoil state - communityState.mySnippets
            setCommunityStateValue((prev) => ({
                ...prev,
                mySnippets: prev.mySnippets.filter(
                    (item) => item.communityId !== communityId
                ),
            }));

            await batch.commit();

        } catch (error: any) {
            console.log("leaveCommunity error", error);
            setError(error.message);
        }
        setLoading(false);
    };

    const getCommunityData = async (communityId: string) => {
        try {
            const communityDocRef = doc(firestore, "communities", communityId);
            const communityDoc = await getDoc(communityDocRef);

            setCommunityStateValue((prev) => ({
                ...prev,
                currentCommunity: {
                    id: communityDoc.id,
                    ...communityDoc.data(),
                } as Community,
            }));

        } catch (error: any) {
            console.log("get communityData error", error.message)
        }
    };

    useEffect(() => {
        if (!user) {
            setCommunityStateValue((prev) => ({
                ...prev,
                mySnippets: [],
                snippetsFetched: false,
            }));
            return;
        }
        getMySnippets();
    }, [user]);

    useEffect(() => {
        const { communityId } = router.query;

        if (communityId && !communityStateValue.currentCommunity) {
            getCommunityData(communityId as string);
        }
    }, [router.query, communityStateValue.currentCommunity]);

    return {
        communityStateValue,
        onJoinOrLeaveCommunity,
        loading
    };
};
export default useCommunityData;