export default function Footer() {
    return (
        <footer className="w-full py-4 bg-gray-800 text-white text-center">
            <div className="container mx-auto flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
                <div className="flex space-x-4">
                    <a href="#" className="hover:underline">About</a>
                    <a href="#" className="hover:underline">Contact</a>
                    <a href="#" className="hover:underline">Privacy Policy</a>
                    <a href="#" className="hover:underline">Terms of Service</a>
                    {/* Optional Social Media Section */}
                    {/* <a href="#" className="hover:underline">Social Media</a> */}
                </div>
            </div>
            <div className="mt-4">
                <p>&copy; 2025 InterestHub. All rights reserved.</p>
            </div>
        </footer>
    );
}