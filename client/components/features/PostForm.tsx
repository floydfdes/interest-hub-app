'use client';

import { Button, Card, Form, Input, message, Select, Typography, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { ImagePlus, Sparkles } from 'lucide-react';
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface';
import imageCompression from 'browser-image-compression';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createPost, getErrorMessage } from '@/app/api/api';
import { IPost } from '@/app/types/user';

const { Title } = Typography;
const { TextArea } = Input;

interface PostFormValues {
    title: string;
    content: string;
    category: string;
    visibility: IPost['visibility'];
}

const PostForm = () => {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fileList, setFileList] = useState<UploadFile[]>([]);

    const getBase64 = (file: File): Promise<string> =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
        });

    const onFinish = async (values: PostFormValues) => {
        const originalImage = fileList[0]?.originFileObj as File | undefined;
        if (!originalImage) {
            message.error('Please select an image.');
            return;
        }

        setLoading(true);
        try {
            const compressedImage = await imageCompression(originalImage, {
                maxSizeMB: 1,
                maxWidthOrHeight: 1920,
                useWebWorker: true,
            });
            const image = await getBase64(compressedImage);

            await createPost({ ...values, image });
            message.success('Post created successfully!');
            router.push('/');
        } catch (error: unknown) {
            message.error(getErrorMessage(error, 'Failed to create post'));
        } finally {
            setLoading(false);
        }
    };

    const handleChange = ({ fileList: nextFileList }: UploadChangeParam<UploadFile>) => {
        setFileList(nextFileList);
    };

    return (
        <Card className="mx-auto w-full max-w-3xl !rounded-[1.75rem] !border-slate-100 !p-1 !shadow-[0_24px_60px_-34px_rgba(30,41,59,0.25)]">
            <div className="mb-8">
                <span className="eyebrow"><Sparkles size={12} /> New post</span>
                <Title level={2} className="!mb-2 !mt-4 !tracking-tight !text-slate-900">Share an interest</Title>
                <p className="text-slate-500">Tell your community what you have been exploring lately.</p>
            </div>
            <Form<PostFormValues>
                layout="vertical"
                onFinish={onFinish}
                initialValues={{ visibility: 'public' }}
            >
                <Form.Item
                    label="Title"
                    name="title"
                    rules={[{ required: true, message: 'Please add a title.' }]}
                >
                    <Input className="soft-input" placeholder="What is this interest about?" />
                </Form.Item>
                <Form.Item
                    label="Content"
                    name="content"
                    rules={[{ required: true, message: 'Please write something!' }]}
                >
                    <TextArea className="soft-input !min-h-36 !p-4" rows={5} placeholder="What's on your mind?" showCount maxLength={500} />
                </Form.Item>
                <Form.Item
                    label="Category"
                    name="category"
                    rules={[{ required: true, message: 'Please add a category.' }]}
                >
                    <Input className="soft-input" placeholder="For example: Photography" />
                </Form.Item>
                <Form.Item label="Visibility" name="visibility">
                    <Select
                        className="!h-12"
                        options={[
                            { value: 'public', label: 'Public' },
                            { value: 'followersOnly', label: 'Followers only' },
                            { value: 'private', label: 'Private' },
                        ]}
                    />
                </Form.Item>
                <Form.Item label="Cover image" required>
                    <Upload
                        listType="picture"
                        fileList={fileList}
                        onChange={handleChange}
                        beforeUpload={() => false}
                        maxCount={1}
                        accept="image/*"
                    >
                        <Button icon={<UploadOutlined />} className="!h-12 !rounded-xl">Select image</Button>
                    </Upload>
                    {fileList.length === 0 && (
                        <div className="mt-3 flex items-center gap-2 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                            <ImagePlus size={16} />
                            Images are compressed automatically before posting.
                        </div>
                    )}
                </Form.Item>
                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        loading={loading}
                        disabled={fileList.length === 0}
                        block
                        size="large"
                        className="!h-12 !rounded-xl !font-semibold"
                    >
                        Publish post
                    </Button>
                </Form.Item>
            </Form>
        </Card>
    );
};

export default PostForm;
