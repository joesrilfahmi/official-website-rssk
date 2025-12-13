interface BannerProps {
    title?: string;
    subtitle?: string;

}

const Banner = ({ title = "Dokter Spesialis", subtitle = "Kosong" }: BannerProps) => {
    return (
        <div className="bg-white py-20">
            <div className="relative bg-linear-to-b from-blue-50 to-white overflow-hidden py-16 md:py-24 rounded-2xl">
                <div className="container mx-auto px-4">
                    <div className="relative z-10 max-w-2xl">
                        <h1 className="text-4xl md:text-5xl font-bold text-mariner-500 mb-6">
                            {title}
                        </h1>

                        <p className="text-lg text-gray-600 max-w-md">
                            {subtitle}</p>
                    </div>

                    {/* Decorative circles */}
                    <div className="absolute -bottom-32 sm:-bottom-48 md:-bottom-48 lg:-bottom-48 -right-2 w-64 h-64 sm:w-96 sm:h-96 md:w-96 md:h-96">
                        <div className="absolute inset-0 bg-blue-100 rounded-full opacity-30"></div>
                        <div className="absolute inset-8 bg-blue-200 rounded-full opacity-20"></div>
                        <div className="absolute inset-16 bg-blue-300 rounded-full opacity-10"></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Banner;