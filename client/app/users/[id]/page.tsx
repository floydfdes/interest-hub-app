'use client';

import { followUser, getErrorMessage, getUserProfile, unfollowUser } from '@/app/api/api';
import { PublicUserProfile } from '@/app/types/user';
import { Avatar, Skeleton } from 'antd';
import { ArrowLeft, LockKeyhole } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function PublicProfilePage() {
    const { id } = useParams<{ id: string }>();
    const [profile, setProfile] = useState<PublicUserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        const loadProfile = async () => {
            try {
                const nextProfile = await getUserProfile(id);
                if (!cancelled) setProfile(nextProfile);
            } catch (err: unknown) {
                if (!cancelled) setError(getErrorMessage(err, 'Failed to load profile.'));
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        void loadProfile();
        return () => {
            cancelled = true;
        };
    }, [id]);

    const toggleFollow = async () => {
        if (!profile) return;
        setUpdating(true);
        setError('');
        try {
            if (profile.isFollowing) {
                await unfollowUser(profile._id);
                setProfile({ ...profile, isFollowing: false, hasRequestedFollow: false });
            } else {
                const response = await followUser(profile._id);
                setProfile({
                    ...profile,
                    isFollowing: response.status !== 'requested',
                    hasRequestedFollow: response.status === 'requested',
                });
            }
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to update follow status.'));
        } finally {
            setUpdating(false);
        }
    };

    if (loading) {
        return <div className="surface shell-container max-w-2xl p-8"><Skeleton active avatar paragraph={{ rows: 4 }} /></div>;
    }

    if (!profile) {
        return <div className="surface shell-container max-w-lg p-10 text-center text-slate-500">{error || 'Profile not found.'}</div>;
    }

    return (
        <div className="shell-container max-w-2xl">
            <Link href="/users" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                <ArrowLeft size={15} /> Back to people
            </Link>
            <section className="surface p-6 sm:p-8">
                <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                    <div className="flex items-center gap-4">
                        <Avatar size={72} src={profile.profilePic || null}>{profile.name.charAt(0)}</Avatar>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{profile.name}</h1>
                            {profile.isPrivate && <p className="mt-1 flex items-center gap-1 text-sm text-slate-500"><LockKeyhole size={14} /> Private account</p>}
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={() => void toggleFollow()}
                        disabled={updating || profile.hasRequestedFollow}
                        className={profile.isFollowing ? 'secondary-button' : 'primary-button'}
                    >
                        {profile.isFollowing ? 'Following' : profile.hasRequestedFollow ? 'Requested' : 'Follow'}
                    </button>
                </div>
                {error && <p className="mt-5 rounded-xl bg-rose-50 p-3 text-sm font-medium text-rose-600">{error}</p>}
                <div className="mt-7 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-slate-50 p-4 text-center"><p className="text-2xl font-semibold text-slate-900">{profile.followersCount}</p><p className="text-sm text-slate-500">Followers</p></div>
                    <div className="rounded-xl bg-slate-50 p-4 text-center"><p className="text-2xl font-semibold text-slate-900">{profile.followingCount}</p><p className="text-sm text-slate-500">Following</p></div>
                </div>
                {!profile.canViewProfile ? (
                    <div className="mt-7 rounded-xl bg-slate-50 p-6 text-center text-slate-500">
                        This profile is private. Follow to view profile details.
                    </div>
                ) : (
                    <div className="mt-7 space-y-5">
                        {profile.bio && <p className="whitespace-pre-line rounded-xl bg-slate-50 p-4 text-slate-700">{profile.bio}</p>}
                        {profile.interests && profile.interests.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {profile.interests.map((interest) => <span key={interest} className="tag-pill">{interest}</span>)}
                            </div>
                        )}
                    </div>
                )}
            </section>
        </div>
    );
}
