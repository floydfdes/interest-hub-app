import { getPostById } from "@/app/api/api";
import { IPost } from "@/app/types/user";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";

export default async function PostPage({ params }: { params: { id: string } }) {
    const post = await getPostById(params.id) as IPost;

    if (!post) {
        return <div className="text-center text-red-500 text-lg">Post not found</div>;
    }

    return (
        <div className="flex flex-col items-center min-h-screen bg-background px-4 py-10">
            <div className="w-full max-w-4xl bg-white border border-gray-200 rounded-md p-6">
                <Image
                    src={post.image || "/Placeholder.png"}
                    alt={post.title}
                    width={800}
                    height={400}
                    className="w-full h-64 object-cover rounded-md border"
                />

                <div className="mt-4 flex items-center gap-3">
                    <Image
                        src={post.author.profilePic || "/DefaultAvatar.png"}
                        alt={post.author.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                    />
                    <div>
                        <h2 className="text-base font-semibold text-primary">{post.author.name}</h2>
                        <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                </div>

                <span className="mt-4 text-sm text-secondary font-medium block">{post.category}</span>
                <h1 className="text-2xl font-bold text-primary mt-1">{post.title}</h1>
                <p className="mt-2 text-sm text-gray-700">{post.content}</p>

                <div className="mt-4 text-sm text-gray-600">
                    <span className="font-medium">Likes:</span> {post.likes?.length || 0}
                </div>

                {/* Comments */}
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-primary mb-4">Comments</h3>

                    {post.comments.map((comment) => (
                        <div key={comment._id} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                            <div className="flex items-center gap-3 mb-2">
                                <Image
                                    src={comment.user.profilePic || "/DefaultAvatar.png"}
                                    alt={comment.user.name}
                                    width={30}
                                    height={30}
                                    className="rounded-full"
                                />
                                <div>
                                    <h4 className="text-sm font-semibold">{comment.user.name}</h4>
                                    <p className="text-sm text-gray-700">{comment.content}</p>
                                </div>
                            </div>

                            <div className="text-xs text-gray-500 flex justify-between">
                                <span>Likes: {comment.likes?.length || 0}</span>
                                <span>Replies: {comment.replies?.length || 0}</span>
                            </div>

                            {comment.replies?.length > 0 && (
                                <div className="mt-3 pl-6 border-l border-gray-300 space-y-3">
                                    {comment.replies.map((reply) => (
                                        <div key={reply._id} className="p-3 bg-white border rounded-md">
                                            <div className="flex items-center gap-3">
                                                <Image
                                                    src={reply.user.profilePic || "/DefaultAvatar.png"}
                                                    alt={reply.user.name}
                                                    width={25}
                                                    height={25}
                                                    className="rounded-full"
                                                />
                                                <div>
                                                    <h4 className="text-sm font-semibold">{reply.user.name}</h4>
                                                    <p className="text-sm text-gray-700">{reply.content}</p>
                                                </div>
                                            </div>
                                            <div className="mt-1 text-xs text-gray-500">
                                                Likes: {reply.likes?.length || 0}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <Link
                href="/explore"
                className="mt-6 inline-block bg-primary text-white px-5 py-2 rounded-md hover:bg-opacity-90 text-sm"
            >
                ← Back to Explore
            </Link>
        </div>
    );
}
