import { getPostById, getPostComments } from "@/app/api/api";
import { IPost } from "@/app/types/user";
import { filterVisibleComments, isUnderReview } from "@/app/utils/moderation";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import BookmarkButton from "@/components/features/BookmarkButton";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const post = await getPostById(id) as IPost;

    if (!post || isUnderReview(post)) {
        return <div className="surface shell-container max-w-xl p-10 text-center text-slate-500">Post not found</div>;
    }

    const commentsResponse = await getPostComments(id);
    const visibleComments = filterVisibleComments(commentsResponse.items);

    return (
        <div className="shell-container flex flex-col items-center">
            <article className="surface w-full max-w-4xl overflow-hidden p-5 sm:p-7">
                <Image
                    src={post.image || "/default_image.png"}
                    alt={post.title}
                    width={800}
                    height={400}
                    className="h-72 w-full rounded-2xl object-cover sm:h-96"
                />

                <div className="mt-6 flex items-center gap-3">
                    <Image
                        src={post.author.profilePic || "/DefaultAvatar.png"}
                        alt={post.author.name}
                        width={40}
                        height={40}
                        className="rounded-full"
                    />
                    <div>
                        <h2 className="text-base font-semibold text-slate-900">{post.author.name}</h2>
                        <p className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                </div>

                <span className="tag-pill mt-6">{post.category}</span>
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900">{post.title}</h1>
                <p className="mt-3 text-base leading-7 text-slate-600">{post.content}</p>

                <div className="mt-5 flex items-center gap-4 text-sm font-medium text-slate-500">
                    <span><span className="font-medium">Likes:</span> {post.likesCount ?? post.likes?.length ?? 0}</span>
                    <BookmarkButton postId={post._id} initialBookmarked={post.isSavedByMe ?? post.isBookmarked} showLabel />
                </div>

                <div className="mt-8 border-t border-slate-100 pt-7">
                    <h3 className="mb-5 text-xl font-semibold text-slate-900">Comments</h3>

                    {visibleComments.map((comment) => (
                        <div key={comment._id} className="mb-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
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
                                    <p className="text-sm text-slate-600">{comment.content}</p>
                                </div>
                            </div>

                            <div className="text-xs text-gray-500 flex justify-between">
                                <span>Likes: {comment.likes?.length || 0}</span>
                                <span>Replies: {comment.replies?.length || 0}</span>
                            </div>

                            {comment.replies?.length > 0 && (
                                <div className="mt-3 space-y-3 border-l border-indigo-100 pl-6">
                                    {comment.replies.map((reply) => (
                                        <div key={reply._id} className="rounded-xl border border-slate-100 bg-white p-3">
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
                                                    <p className="text-sm text-slate-600">{reply.content}</p>
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
            </article>

            <Link
                href="/explore"
                className="secondary-button mt-6"
            >
                ← Back to Explore
            </Link>
        </div>
    );
}
