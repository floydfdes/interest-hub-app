'use client';

import { useState } from 'react';
import { Form, Input, Button, Card, message, Select, Typography, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import imageCompression from 'browser-image-compression';

const { Title } = Typography;
const { TextArea } = Input;

const PostForm = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fileList, setFileList] = useState<any[]>([]);

    const getBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = (error) => reject(error);
        });

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            const compressedImage = await imageCompression(fileList[0].originFileObj, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            });
            const image = await getBase64(compressedImage);

            await api.post('/posts', {
                title: values.title,
                content: values.content,
                category: values.category,
                visibility: values.visibility,
                image,
            });
            message.success('Post created successfully!');
            router.push('/');
        } catch (error: any) {
            message.error(error.response?.data?.message || 'Failed to create post');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = ({ fileList: newFileList }: any) => setFileList(newFileList);

    return (
        <Card className="w-full max-w-2xl mx-auto shadow-md">
            <Title level={3} className="text-center mb-6">Create New Post</Title>
            <Form
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ visibility: 'public' }}
            >
                <Form.Item
                    label="Title"
                    name="title"
                    rules={[{ required: true, message: 'Please add a title.' }]}
                >
                    <Input placeholder="What is this interest about?" />
                </Form.Item>
                <Form.Item
                    label="Content"
                    name="content"
                    rules={[{ required: true, message: 'Please write something!' }]}
                >
                    <TextArea rows={4} placeholder="What's on your mind?" showCount maxLength={500} />
                </Form.Item>
                <Form.Item
                    label="Category"
                    name="category"
                    rules={[{ required: true, message: 'Please add a category.' }]}
                >
                    <Input placeholder="For example: Photography" />
                </Form.Item>
                <Form.Item label="Visibility" name="visibility">
                    <Select
                        options={[
                            { value: 'public', label: 'Public' },
                            { value: 'followersOnly', label: 'Followers only' },
                            { value: 'private', label: 'Private' },
                        ]}
                    />
                </Form.Item>
                <Form.Item
                    label="Image"
                    required
                    validateStatus={fileList.length === 0 ? undefined : 'success'}
                >
                    <Upload
                        listType="picture"
                        fileList={fileList}
                        onChange={handleChange}
                        beforeUpload={() => false} // Manual upload
                        maxCount={1}
                        accept="image/*"
                    >
                        <Button icon={<UploadOutlined />}>Select Image</Button>
                    </Upload>
                </Form.Item>

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        disabled={fileList.length === 0}
                        block
                        size="large"
                    >
                        Post
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default PostForm;
