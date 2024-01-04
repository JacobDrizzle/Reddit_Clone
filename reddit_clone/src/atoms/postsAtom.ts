import { atom } from "recoil";
import { Timestamp } from "firebase/firestore";

export type Post = {
    id: string;
    communityId: string;
    creatorDisplayName: string;
    creatorId: string;
    title: string;
    body: string;
    numberOfComments: number;
    voteStatus: number;
    imageURL?: string;
    communityImageURL?: string;
    createdAt: Timestamp;
    editedAt?: Timestamp;
};

export type postVote = {
    id: string;
    postId: string;
    communityId: string;
    voteValue: number;
}

interface PostState {
    selectedPost: Post | null,
    posts: Post[];
    postVotes: postVote[];
}

const defaultPostState: PostState = {
    selectedPost: null,
    posts: [],
    postVotes: [],
};

export const postState = atom<PostState>({
    key: 'postState',
    default: defaultPostState
})