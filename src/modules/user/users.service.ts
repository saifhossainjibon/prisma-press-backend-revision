import bcrypt from "bcryptjs";
import { prisma } from "../../lib/prisma";
import config from "../../config";
import { RegisterUserPayload } from "./user.interface";

const registerUserIntoDB = async (payload: RegisterUserPayload) => {
  const { name, email, password, profilePhoto } = payload;
  const isUserExist = await prisma.user.findUnique({
    where: { email }
  });
  if (isUserExist) {
    throw new Error("user with this email already exist");
  }
  const hashedPassword = await bcrypt.hash(
    password,
    Number(config.bcrypt_salt_rounds),
  );
  const createdUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      profile: {
        create: {
          profilePhoto,
        },
      },
    },
  });
  // aita korar fole amra user er data find korci jaita respose pabo
  const user = await prisma.user.findUnique({
    where: {
      id: createdUser.id,
      email: createdUser.email || email,
    },
    omit: {
      password: true,
    },
    include: {
      profile: true,
    },
  });
  return user;
};

const getMyProfileFromDB = async(id: string)=>{
  const user = await prisma.user.findUniqueOrThrow({
    where:{id},
    omit:{password: true},
    include:{profile:true}
  })
  return user
}
const updateMyProfileIntoDB = async(id: string, payload: any)=>{
    const {name, email, profilePhoto, bio}=payload
    const updatedUser =await prisma.user.update({
      where:{id},
      data:{
        name,
        email,
        profile:{
          update:{
            profilePhoto, bio
          }
      }},
      omit:{password:true},
      include:{profile:true}
    })
    return updatedUser;
}
export const userService = {
  registerUserIntoDB,getMyProfileFromDB,updateMyProfileIntoDB
};
