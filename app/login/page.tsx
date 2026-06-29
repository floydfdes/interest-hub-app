'use client';

import { forgotPassword, getErrorMessage, loginUser } from '@/app/api/api';
import { notifyAuthChanged } from '@/app/hooks/useCurrentUser';
import { LoginInput } from '@/app/types/user';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { App, Button, Card, Form, Input, Modal, Typography } from 'antd';
import { ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const { Title, Text } = Typography;

const Login = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [forgotOpen, setForgotOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const { message } = App.useApp();

    const onFinish = async (values: LoginInput) => {
        setLoading(true);
        try {
            const response = await loginUser(values);
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            notifyAuthChanged();
            message.success('Login successful!');
            router.push('/');
        } catch (error: unknown) {
            message.error(getErrorMessage(error, 'Login failed'));
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        const email = forgotEmail.trim();
        if (!email) {
            message.error('Please enter your email address.');
            return;
        }

        setForgotLoading(true);
        try {
            await forgotPassword(email);
            message.success('Password reset instructions sent if that email exists.');
            setForgotOpen(false);
            setForgotEmail('');
        } catch (error: unknown) {
            message.error(getErrorMessage(error, 'Failed to request password reset.'));
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div className="shell-container grid min-h-[calc(100vh-14rem)] items-center gap-10 lg:grid-cols-[1fr_29rem]">
            <section className="hidden max-w-lg lg:block">
                <span className="eyebrow"><Sparkles size={12} /> Welcome back</span>
                <h1 className="gradient-heading mt-5 text-5xl font-bold leading-[1.08]">
                    Pick up your favorite conversations.
                </h1>
                <p className="mt-5 text-lg leading-8 text-slate-500">
                    Sign in to discover new interests, keep up with creators, and share your latest idea.
                </p>
            </section>
            <Card className="!rounded-[1.75rem] !border-slate-100 !shadow-[0_26px_60px_-34px_rgba(30,41,59,0.3)]">
                <div className="mb-8">
                    <span className="eyebrow lg:hidden">Welcome back</span>
                    <Title level={2} className="!mb-2 !mt-4 !tracking-tight !text-slate-900">Log in</Title>
                    <Text className="!text-slate-500">Continue your InterestHub journey.</Text>
                </div>
                <Form
                    name="login"
                    onFinish={onFinish}
                    layout="vertical"
                    size="large"
                >
                    <Form.Item
                        name="email"
                        rules={[
                            { required: true, message: 'Please input your Email!' },
                            { type: 'email', message: 'Please enter a valid email!' },
                        ]}
                    >
                        <Input data-testid="login-email" className="soft-input" prefix={<MailOutlined className="text-slate-400" />} placeholder="Email address" />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please input your Password!' }]}
                    >
                        <Input.Password data-testid="login-password" className="soft-input" prefix={<LockOutlined className="text-slate-400" />} placeholder="Password" />
                    </Form.Item>

                    <div className="-mt-2 mb-5 text-right">
                        <button
                            type="button"
                            onClick={() => setForgotOpen(true)}
                            className="text-sm font-semibold text-indigo-600 transition hover:text-indigo-700"
                        >
                            Forgot password?
                        </button>
                    </div>

                    <Form.Item>
                        <Button data-testid="login-submit" type="primary" htmlType="submit" block loading={loading} className="!h-12 !rounded-xl !font-semibold">
                            Log in <ArrowRight size={15} />
                        </Button>
                    </Form.Item>
                    <div className="space-y-2 text-center">
                        <div>
                            <Text>Don&apos;t have an account? </Text>
                            <Link href="/register" className="font-semibold text-indigo-600 hover:text-indigo-700">
                                Create an account
                            </Link>
                        </div>
                        <Link href="/reactivate" className="block text-sm font-semibold text-slate-500 hover:text-indigo-600">
                            Reactivate a deactivated account
                        </Link>
                    </div>
                </Form>
            </Card>

            <Modal
                title="Forgot password"
                open={forgotOpen}
                onCancel={() => {
                    setForgotOpen(false);
                    setForgotEmail('');
                }}
                footer={null}
                destroyOnHidden
            >
                <p className="mb-4 text-sm text-slate-500">
                    Enter your account email and we will send reset instructions.
                </p>
                <Input
                    type="email"
                    value={forgotEmail}
                    onChange={(event) => setForgotEmail(event.target.value)}
                    onPressEnter={() => void handleForgotPassword()}
                    className="soft-input"
                    prefix={<MailOutlined className="text-slate-400" />}
                    placeholder="Email address"
                    autoFocus
                />
                <div className="mt-5 flex justify-end gap-2">
                    <Button onClick={() => setForgotOpen(false)} disabled={forgotLoading}>
                        Cancel
                    </Button>
                    <Button type="primary" loading={forgotLoading} onClick={() => void handleForgotPassword()}>
                        Send reset link
                    </Button>
                </div>
            </Modal>
        </div>
    );
};

export default Login;
