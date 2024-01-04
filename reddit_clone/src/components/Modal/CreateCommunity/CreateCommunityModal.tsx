import { auth, firestore } from '../../../firebase/clientApp';
import { Button, Modal, Text, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, ModalFooter, Box, Divider, Input, Checkbox, Stack, Flex, Icon } from '@chakra-ui/react';
import { doc, getDoc, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';
import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { BsFillEyeFill, BsFillPersonFill } from 'react-icons/bs';
import { HiLockClosed } from 'react-icons/hi';
import { async } from '@firebase/util';
import { useRouter } from 'next/router';
import useDirectory from '@/hooks/useDirectory';

type CreateCommunityModalProps = {
    open: boolean;
    handleClose: () => void;
};

const CreateCommunityModal: React.FC<CreateCommunityModalProps> = ({
    open,
    handleClose
}) => {
    const [user] = useAuthState(auth);
    const [communityName, setCommunityName] = useState("");
    const [charsRemaining, setCharsRemaining] = useState(21);
    const [communityType, setCommunityType] = useState("public");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { toggleMenuOpen } = useDirectory();

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.value.length > 21) return;
        setCommunityName(event.target.value);
        //calc how many chars left 
        setCharsRemaining(21 - event.target.value.length);
    };

    const onCommunityTypeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setCommunityType(event.target.name);
    }

    const handleCreateCommunity = async () => {
        if (error) setError("");
        // Validate the community name
        if (error) setError("");
        const format = /[ `!@#$%^&*()+\-=\[\]{};':"\\|,.<>\/?~]/;

        if (format.test(communityName) || communityName.length < 3) {
            setError(
                "Community names must be between 3-21 characters, and can only contain letters, numbers, or underscores."
            );
            return;
        }

        setLoading(true);

        try {
            const communityDocRef = doc(firestore, "communities", communityName);

            await runTransaction(firestore, async (transaction) => {
                // Check if community exists in db
                const communityDoc = await transaction.get(communityDocRef);
                if (communityDoc.exists()) {
                    throw new Error(`Sorry, r/${communityName} is already taken. Try another`);
                }
                // Create community
                transaction.set(communityDocRef, {
                    creatorId: user?.uid,
                    createdAt: serverTimestamp(),
                    numberOfMembers: 1,
                    privacyType: communityType,
                });

                //create community snippet
                transaction.set(doc(firestore, `users/${user?.uid}/communitySnippets`, communityName,),
                    {
                        communityId: communityName,
                        isModerator: true,
                    }
                );
            });

            handleClose();
            toggleMenuOpen();
            router.push(`r/${communityName}`)

        } catch (error: any) {
            console.log("handleCreateCommunity error", error);
            setError(error.message)
        }
        // Create the community document in firebase
        // Check that name is not take
        // If name is valid, create community


        setLoading(false);
    };
    return (
        <>

            <Modal isOpen={open} onClose={handleClose} size="lg">
                <ModalOverlay />
                <ModalContent>
                    <ModalHeader
                        display="flex"
                        flexDirection="column"
                        fontSize={15}
                        padding={3}
                    >Create a community
                    </ModalHeader>

                    <Box pl={3} pr={3}>

                        <Divider />

                        <ModalCloseButton />

                        <ModalBody
                            display="flex"
                            flexDirection="column"
                            padding="10px 0px"
                        >
                            <Text
                                fontWeight={600}
                                fontSize={15}>
                                Name
                            </Text>

                            <Text
                                fontSize={12}
                                color="gray.500">
                                Community names including capitalization cannot be changed
                            </Text>

                            <Text
                                position="relative"
                                top="28px"
                                left="10px"
                                width="20px"
                                color="gray.400">
                                r/</Text>
                            <Input
                                position="relative"
                                value={communityName}
                                size="sm" pl="22px"
                                onChange={handleChange}
                            />

                            <Text
                                fontSize={12}
                                color={charsRemaining === 0 ? "red" : "gray.500"}>
                                {charsRemaining} Charecters remaining
                            </Text>

                            <Text
                                fontSize="10pt"
                                color="red"
                                pt={1}
                            >
                                {error}
                            </Text>

                            <Box>
                                <Text
                                    fontWeight={600}
                                    fontSize={15}
                                    mt={4}
                                    mb={4}
                                >Community Type
                                </Text>

                                {/* <Checkbox />*/}
                                <Stack spacing={2}>
                                    <Checkbox
                                        name="public"
                                        isChecked={communityType === "public"}
                                        onChange={onCommunityTypeChange}
                                    >
                                        <Flex>
                                            <Icon as={BsFillPersonFill} color="gray.500" mr={2} />
                                            <Text
                                                fontWeight={700}
                                                fontSize="10pt"
                                                mr={1}
                                            >
                                                Public
                                            </Text>

                                            <Text
                                                fontSize="8pt"
                                                color="gray.500"
                                                pt={0.5}>
                                                Anyone can view, post and comment to this community
                                            </Text>
                                        </Flex>
                                    </Checkbox>

                                    <Checkbox
                                        name="restricted"
                                        isChecked={communityType === "restricted"}
                                        onChange={onCommunityTypeChange}
                                    >
                                        <Flex>
                                            <Icon as={BsFillEyeFill} color="gray.500" mr={2} />
                                            <Text
                                                fontWeight={700}
                                                fontSize="10pt"
                                                mr={1}
                                            >
                                                Restricted
                                            </Text>

                                            <Text
                                                fontSize="8pt"
                                                color="gray.500"
                                                pt={0.5}>
                                                Anyone can view this community, but only approved users can post
                                            </Text>
                                        </Flex>
                                    </Checkbox>

                                    <Checkbox
                                        name="private"
                                        isChecked={communityType === "private"}
                                        onChange={onCommunityTypeChange}
                                    >
                                        <Flex>
                                            <Icon as={HiLockClosed} color="gray.500" mr={2} />
                                            <Text
                                                fontWeight={700}
                                                fontSize="10pt"
                                                mr={0.5}
                                            >
                                                Private
                                            </Text>

                                            <Text
                                                fontSize="8pt"
                                                color="gray.500"
                                                pt={0.5}>
                                                Only approved users can view and submit to this community
                                            </Text>
                                        </Flex>
                                    </Checkbox>
                                </Stack>
                            </Box>
                        </ModalBody>
                    </Box>


                    <ModalFooter
                        bg="gray.100"
                        borderRadius="0px 0px 10px 10px"
                    >
                        <Button variant="outline"
                            height="30px"
                            mr={3}
                            onClick={handleClose}
                        >
                            Cancle
                        </Button>

                        <Button height="30px"
                            onClick={handleCreateCommunity}
                            isLoading={loading}
                        >
                            Create Community
                        </Button>
                    </ModalFooter>
                </ModalContent>
            </Modal >
        </>
    )
}
export default CreateCommunityModal;