import { Category } from "../types";

// Gorseller, projede zaten kullanilan Unsplash fitness fotograflaridir (bkz. app/pages/workouts/mockData.ts);
// yuklenemezse kategori ikonlu yedek gorunum gosterilir.
const photo = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=600&q=60`;

export const CATEGORIES: Category[] = [
  { id: "cat-protein", name: "Protein ve Takviyeler", slug: "protein-ve-takviyeler", image: photo("photo-1544367567-0f2fcb009e0b"), icon: "nutrition-outline" },
  { id: "cat-giyim", name: "Spor Giyim", slug: "spor-giyim", image: photo("photo-1518611012118-696072aa579a"), icon: "shirt-outline" },
  { id: "cat-ekipman", name: "Fitness Ekipmanları", slug: "fitness-ekipmanlari", image: photo("photo-1583454110551-21f2fa2afe61"), icon: "barbell-outline" },
  { id: "cat-aksesuar", name: "Antrenman Aksesuarları", slug: "antrenman-aksesuarlari", image: photo("photo-1517836357463-d25dfeac3438"), icon: "water-outline" },
  { id: "cat-teknoloji", name: "Akıllı Saatler ve Teknoloji", slug: "akilli-saatler-ve-teknoloji", image: photo("photo-1571019613454-1cb2f99b2d8b"), icon: "watch-outline" },
  { id: "cat-saglik", name: "Sağlıklı Yaşam", slug: "saglikli-yasam", image: photo("photo-1538805060514-97d9cc17730c"), icon: "leaf-outline" },
];
