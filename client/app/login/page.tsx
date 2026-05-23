'use client';

import { useState } from 'react';
import { Form, Input, Button, Card, message, Typography } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getErrorMessage, loginUser } from '@/app/api/api';
import { notifyAuthChanged } from '@/app/hooks/useCurrentUser';
import { LoginInput } from '@/app/types/user';

const { Title, Text } = Typography;

const Login = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

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

    return (
        <div className="flex justify-center items-center min-h-[80vh]">
            <Card className="w-full max-w-md shadow-lg rounded-xl">
                <div className="text-center mb-8">
                    <Title level={2} className="!mb-2">Welcome Back</Title>
                    <Text type="secondary">Login to continue to InterestHub</Text>
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
                        <Input prefix={<MailOutlined />} placeholder="Email" />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please input your Password!' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit" block loading={loading}>
                            Login
                        </Button>
                    </Form.Item>
                    <div className="text-center">
                        <Text>Don&apos;t have an account? </Text>
                        <Link href="/register" className="text-blue-600 hover:underline">
                            Register
                        </Link>
                    </div>
                </Form>
            </Card>
        </div>
    );
};

export default Login;
