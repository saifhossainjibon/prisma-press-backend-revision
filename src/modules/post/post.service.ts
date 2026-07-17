import { CommentStatus, PostStatus } from "../../../generated/prisma/enums";
import { PostWhereInput } from "../../../generated/prisma/models";
import { prisma } from "../../lib/prisma";
import { ICreatePostPayload, IPostQuery, IUpdatePostPayload } from "./post.interface";

const createPost = async (payload: ICreatePostPayload, authorId: string) => {
  const result = await prisma.post.create({
    data: {
      ...payload,
      authorId,
    },
  });
  return result;
};

const getAllPosts = async (query : IPostQuery) => {
  const limit = query.limit ? Number(query.limit) : 10;
  const page = query.page ? Number(query.page) : 1;
  const skip = (page - 1) * limit
  const sortBy = query.sortBy ? query.sortBy : "createdAt"
  const sortOrder = query.sortOrder ? query.sortOrder : "desc"
  const andConditions : PostWhereInput[] = []
  const tags = query.tags ? JSON.parse(query.tags as string) : null
  const tagsArray = Array.isArray(tags) ? tags : [] 

  if(query.searchTerm){
    andConditions.push({
        OR:[
              {
                title:{
                  contains:query.searchTerm,
                  mode:"insensitive"
                }
              },
              {
                content:{
                  contains: query.searchTerm,
                  mode:"insensitive"
                }
              }
            ]
    })
  }
    if(query.title) {
        andConditions.push({
            title : query.title
        })
    }

    if(query.content) {
        andConditions.push({
            content : query.content
        })
    }

    if(query.authorId){
        andConditions.push({
            authorId : query.authorId
        })
    }

    if(query.isFeatured) {
        andConditions.push({
            isFeatured: Boolean(query.isFeatured)
        })
    }

    if(query.tags){
        andConditions.push({
            tags : {
                hasSome : tagsArray
            }
        })
    }

    if(query.status) {
        andConditions.push({
            status: query.status
        })
    }

  const posts = await prisma.post.findMany(
    {
     /* niche amra static vabe deakhsi akhon dynamically korbo */
      // dynamic searching, filtering
      // where:{
      //   AND :[
      //     query.searchTerm ? {
      //       OR:[
      //         {
      //           title:{
      //             contains:query.searchTerm,
      //             mode:"insensitive"
      //           }
      //         },
      //         {
      //           content:{
      //             contains: query.searchTerm,
      //             mode:"insensitive"
      //           }
      //         }
      //       ]
      //     } : {},
      //     query.title ? {title: query.title} : {},
      //     query.content ? {title: query.content} : {}
      //   ]
      // },

      /*More Better way of dynamic searching, filtering */
      where:{
        AND: andConditions
      },    
      // dynamic pagination and sorting
      take: limit,
      skip: skip,
      orderBy: {
        // sortBy  :  sortOrder
        [sortBy] : sortOrder
      },
      // here we have just req for all post get that's why WHERE is not needed
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
const getPostsStats = async () => {
  const transactionResult = await prisma.$transaction(async (tx) => {
    const [
      totalPosts,
      totalPublishedPosts,
      totalDraftPosts,
      totalArchivedPosts,
      totalComments,
      totalApprovedComments,
      totalRejectedComments,
      totalPostViewsAggregate,
    ] = await Promise.all([
      await tx.post.count(),
      await tx.post.count({
        where: {
          status: PostStatus.PUBLISHED,
        },
      }),
      await tx.post.count({
        where: {
          status: PostStatus.DRAFT,
        },
      }),
      await tx.post.count({
        where: {
          status: PostStatus.ARCHIVED,
        },
      }),
      await tx.comment.count(),
      await tx.comment.count({
        where: {
          status: CommentStatus.APPROVED,
        },
      }),
      await tx.comment.count({
        where: {
          status: CommentStatus.REJECTED,
        },
      }),
      await tx.post.aggregate({
        _sum: {
          views: true,
        },
      }),
    ]);
    return {
      totalPosts,
      totalPublishedPosts,
      totalDraftPosts,
      totalArchivedPosts,
      totalComments,
      totalApprovedComments,
      totalRejectedComments,
      totalPostViews: totalPostViewsAggregate._sum.views,
    };
  });
  return transactionResult;
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

      // where : {
      //     //filtering & searching combined
      //     AND : [
      //         {
      //             // searching
      //             OR : [
      //                 {
      //                     title : {
      //                         contains : "Ron",
      //                         mode : "insensitive"
      //                     }
      //                 },

      //                 {
      //                     content : {
      //                         contains : "Ron",
      //                         mode : "insensitive"
      //                     }

      //                 }
      //             ]
      //         },

      //         // filtering
      //         {
      //             title : "Ronaldo nazario"
      //         },

      //         {
      //             content : "ronaldo"
      //         }
      //     ]
      // },

      // Pagination with (limit or take) and (skip or page )

      // take : 1,
      // take : 2,
      // skip: 0,// for first page skip is 0
      // skip : 1, // visiting page 2
      // skip : 2, // visiting page 3
      // skip: 3, // visiting page 4
      // page =4 , limit / take = 1 => skip : (page-1) * limit =>

      // page = 3, limit / take = 10 => skip : (page -1 ) * limit = (3-1) * 10 = 20


      // sorting 
      // orderBy:{
      //   createdAt: "desc"
      // },