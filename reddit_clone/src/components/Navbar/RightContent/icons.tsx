import React from "react";
import { AddIcon } from "@chakra-ui/icons";
import { Box, Flex, Icon } from "@chakra-ui/react";
import { BsArrowUpRightCircle, BsChatDots } from "react-icons/bs";
import { GrAdd } from "react-icons/gr";
import {
    IoFilterCircleOutline,
    IoNotificationsOutline,
    IoVideocamOutline,
} from "react-icons/io5";

const Icons: React.FC = () => {
    return (
        <Flex>
            <Flex alignItems="center" flexGrow={1}>
                <Box
                    display={{ base: "none", md: "flex" }}
                    alignItems="center"
                    borderRight="1px solid"
                    borderColor="gray.200"
                >
                    <Flex
                        mr={1.5} ml={1.5}
                        cursor="pointer"
                        borderRadius={4}
                        _hover={{ bg: "gray.200" }}
                    >
                        <Icon as={BsArrowUpRightCircle} />
                    </Flex>

                    <Flex
                        mr={1.5} ml={1.5}
                        cursor="pointer"
                        borderRadius={4}
                        _hover={{ bg: "gray.200" }}
                    >
                        <Icon as={IoFilterCircleOutline} fontSize={20} />
                    </Flex>

                    <Flex
                        mr={1.5} ml={1.5}
                        cursor="pointer"
                        borderRadius={4}
                        _hover={{ bg: "gray.200" }}
                    >
                        <Icon as={IoVideocamOutline} fontSize={22} />
                    </Flex>
                </Box>
                <Flex
                    mr={1.5} ml={1.5}
                    cursor="pointer"
                    borderRadius={4}
                    _hover={{ bg: "gray.200" }}
                >
                    <Icon as={BsChatDots} fontSize={19} />
                </Flex>

                <Flex
                    mr={1.5} ml={1.5}
                    cursor="pointer"
                    borderRadius={4}
                    _hover={{ bg: "gray.200" }}
                >
                    <Icon as={IoNotificationsOutline} fontSize={21} />
                </Flex>

                <Flex
                    display={{ base: "none", md: "flex" }}
                    mr={1.5} ml={1.5}
                    cursor="pointer"
                    borderRadius={4}
                    _hover={{ bg: "gray.200" }}
                >
                    <Icon as={GrAdd} fontSize={20} />
                </Flex>
            </Flex>
            <></>
        </Flex >
    );
};

export default Icons;