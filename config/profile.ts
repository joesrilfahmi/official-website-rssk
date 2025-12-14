// config/profile.ts
export interface Profile {
  institusi: string;
  name: string;
  shortName: string;
  subtitle: string;
  logo: string;
  description: string;
  address: string;
  phone: string;
  whatsapp: string;
  ambulance: string;
  pusatPanggilan: string;
  email: string;
}

export interface Location {
  name: string;
  address: string;
}

export interface RumahSakit {
  name: string;
  url: string;
  alamat: string;
}

export interface SocialMedia {
  name: string;
  url: string;
  icon?: string;
}

export const Profile: Profile = {
  institusi : "Rumah Sakit",
  name: "Siti Khodijah",
  shortName: "RS Siti Khodijah",
  subtitle: "Muhammadiyah Cabang Sepanjang",
  logo: "/rssk.webp",
  description: "Rumah Sakit terpercaya dengan layanan kesehatan berkualitas",
  address: "Jl. Raya Bebekan, RT.02/ RW.01, Bebekan, Kec. Taman, Kabupaten Sidoarjo, Jawa Timur 61257",
  phone: "0317883980",
  whatsapp: "08113087119",
  ambulance: "08113330988",
  pusatPanggilan: "0317881130",
  email: "humas@sitikhodijah.com",
};

export const rumahSakit: RumahSakit[] = [
  {
    name: "RS Siti Khodijah Muhammadiyah Cabang Sepanjang",
    url: "https://www.sitikhodijah.com",
    alamat: "Jl. Contoh No. 123, Surabaya, Jawa Timur"
  },
  {
    name: "RSU Assakinah Medika",
    url: "https://assekinah.com",
    alamat: "Jl. Contoh No. 456, Sidoarjo, Jawa Timur"
  },
  {
    name: "RS Moedjito Dwidjosiswojo",
    url: "https://moedjito.com",
    alamat: "Jl. Contoh No. 789, Jombang, Jawa Timur"
  },
  {
    name: "Klinik Siti Khodijah Prima",
    url: "https://klinik.sitikhodijah.com",
    alamat: "Jl. Contoh No. 321, Surabaya, Jawa Timur"
  }
];


export const socialMedia: SocialMedia[] = [
  {
    name: "Instagram",
    url: "https://www.instagram.com/rssitikhodijah",
    icon: "instagram"
  },
  {
    name: "Facebook",
    url: "https://www.facebook.com/rssitikhodijah",
    icon: "facebook"
  },
  {
    name: "Youtube",
    url: "https://www.youtube.com/@rssitikhodijah",
    icon: "youtube"
  },
  {
    name: "Tiktok",
    url: "https://www.tiktok.com/@rssitikhodijah",
    icon: "tiktok"
  }
];

export default Profile;