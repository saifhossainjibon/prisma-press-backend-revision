import { CommentStatus, PostStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { ICreatePostPayload, IUpdatePostPayload } from "./post.interface";

const createPost = async (payload: ICreatePostPayload, authorId: string) => {
  const result = await prisma.post.create({
    data: {
      ...payload,
      authorId,
    },
  });
  return result;
};

const getAllPosts = async () => {
  const posts = await prisma.post.findMany(
    // aikhne just amra all post get korci tai where lagbe na and vitore kicu condition
    {
      // multiple field er upor filtering
      // where:{
      //   title:"My fouth Post",
      //   content: "Ronaldo"
      // },

      // another way of above filtering (with AND)
      // where:{
      //   AND:[
      //     {
      //       title:"My fouth Post"
      //     },
      //     {
      //       content: "Ronaldo"
      //     },
      //     {
      //       tags:{
      //         // has: "typescript",(also you can use 1 veriable)
      //         equals:[
      //           "typescript",
      //           "prisma",
      //           "express"
      //         ]
      //       }
      //     }
      //   ]
      // },

      // searching  partial match 
      // where:{
      //   title:{
      //     contains: "ronaldo",
      //     mode: "insensitive" //(configure sensetive)
      //   },
      //   // not ideal for partial match ( er fole title and content e  "ronaldo" jaigula thakbe just oigula asbe)
      //   content:{
      //     contains: "ronaldo"
      //   }
      // },

    // where:{
    //     OR:[
    //       {
    //         title:{
    //           contains: "Ronaldo",
    //           mode: "insensitive"
    //         }
    //       },
    //       {
    //         content:{
    //           contains: "Ronaldo",
    //           mode: "insensitive"
    //         }
    //       },
    //     ]
    //   },

            // combining search (OR Operator) and filtering (AND)

            where : {
                //filtering & searching combined
                AND : [
                    {
                        // searching
                        OR : [
                            {
                                title : {
                                    contains : "Ron",
                                    mode : "insensitive"
                                }
                            },

                            {
                                content : {
                                    contains : "Ron",
                                    mode : "insensitive"
                                }
                                
                            }
                        ]
                    },

                    // filtering
                    {
                        title : "Ronaldo nazario"
                    },

                    {
                        content : "ronaldo"
                    }
                ]
            },
    
      include: {
        author: {
          omit: {
            password: true,
          },
        },
        comments: true,
      },
    },
  );
  return posts;
};
const getPostById = async (postId: string) => {
  const transactionResult = await prisma.$transaction(async (tx) => {
    await tx.post.update({
      where: { id: postId },
      data: {
        views: {
          increment: 1,
        },
      },
    });
    const post = await tx.post.findUniqueOrThrow({
      where: { id: postId },
      include: {
        author: {
          omit: {
            password: true,
          },
        },
        //   amra chacci just onlu approved comment gula dekhte
        comments: {
          where: {
            status: CommentStatus.APPROVED,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
    });
    return post;
  });
  return transactionResult;
};
const updatePost = async (
  postId: string,
  payload: IUpdatePostPayload,
  authorId: string,
  isAdmin: boolean,
) => {
  const post = await prisma.post.findFirstOrThrow({
    where: {
      id: postId,
    },
  });
  if (!isAdmin && post.authorId !== authorId) {
    throw new Error("You are not the owner of this post!");
  }

  const result = await prisma.post.update({
    where: {
      id: postId,
    },
    data: payload,
    include: {
      author: {
        omit: {
          password: true,
        },
      },
      comments: true,
    },
  });

  return result;
};
const deletePost = async (
  postId: string,
  authorId: string,
  isAdmin: boolean,
) => {
  const post = await prisma.post.findFirstOrThrow({
    where: {
      id: postId,
    },
  });
  if (!isAdmin && post.authorId !== authorId) {
    throw new Error("You are not the owner of this post!");
  }
  // jehetu amra kicu data te dicci na tai const varibable e kicu rakhbo na
  await prisma.post.delete({
    where: {
      id: postId,
    },
  });
};
const getPostsStats = async() => {
    const transactionResult = await prisma.$transaction(async(tx)=>{
        const [
            totalPosts,
            totalPublishedPosts,
            totalDraftPosts,
            totalArchivedPosts,
            totalComments,
            totalApprovedComments,
            totalRejectedComments,
            totalPostViewsAggregate
        ]=await Promise.all([
            await tx.post.count(),
            await tx.post.count({
                where:{
                    status: PostStatus.PUBLISHED
                }
            }),
            await tx.post.count({
                where:{
                    status: PostStatus.DRAFT
                }
            }),
            await tx.post.count({
                where:{
                    status: PostStatus.ARCHIVED
                }
            }),
            await tx.comment.count(),
            await tx.comment.count({
                where:{
                    status: CommentStatus.APPROVED
                }
            }),
            await tx.comment.count({
                where:{
                    status: CommentStatus.REJECTED
                }
            }),
            await tx.post.aggregate({
                _sum:{
                    views: true
                }
            }),

        ])
        return {
            totalPosts,
            totalPublishedPosts,
            totalDraftPosts,
            totalArchivedPosts,
            totalComments,
            totalApprovedComments,
            totalRejectedComments,
            totalPostViews: totalPostViewsAggregate._sum.views
        }
    })
    return transactionResult
};

const getMyPosts = async (authorId: string) => {
  const result = await prisma.post.findMany({
    where: {
      authorId,
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      author: {
        omit: {
          password: true,
        },
      },
      comments: true,
      // ai array te koto gula data ace saita count korar jonno
      _count: {
        select: {
          comments: true,
        },
      },
    },
  });
  return result;
};
export const postService = {
  createPost,
  getAllPosts,
  getPostById,
  updatePost,
  deletePost,
  getPostsStats,
  getMyPosts,
};
