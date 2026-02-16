import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import datetime, date
from db import Base, engine, SessionLocal
from models import Owner, HRManager, Employee, User, LeaveRequest
from core.security import get_password_hash
from schemas import FirmaSahibi, IKYonetici, Personel
import json

def seed_data():
    print("Veritabanı şeması güncelleniyor...")
    
    # Tüm şema işlemlerini tek bir bağlantı üzerinden yapalım
    with engine.connect() as connection:
        trans = connection.begin()
        try:
            # FK Kontrolünü kapat
            connection.execute(text("SET FOREIGN_KEY_CHECKS = 0;"))
            
            # Tabloları sıfırla
            Base.metadata.drop_all(bind=connection)
            Base.metadata.create_all(bind=connection)
            
            # FK Kontrolünü aç
            connection.execute(text("SET FOREIGN_KEY_CHECKS = 1;"))
            trans.commit()
            print("✅ Tablolar oluşturuldu.")
        except Exception as e:
            trans.rollback()
            print(f"❌ Hata: {e}")
            return

    # Veri ekleme işlemleri için yeni bir oturum açalım
    db = SessionLocal()

    # 1. Firma Sahibi: Mehmet Kaya
    owner = Owner(
        username="mehmet.kaya",
        email="mehmet.kaya@sirket.com",
        first_name="Mehmet",
        last_name="Kaya",
        full_name="Mehmet Kaya",
        password_hash=get_password_hash("123456"),
        department="Yönetim Kurulu",
        salary=150000.0,
        start_date=datetime(2020, 1, 1),
        share_rate=100.0,
        type="firma_sahibi",
        is_active=True
    )

    # 2. İK Yöneticisi: Berkay Yılmaz
    hr_manager = HRManager(
        username="berkay.yilmaz",
        email="berkay.yilmaz@sirket.com",
        first_name="Berkay",
        last_name="Yılmaz",
        full_name="Berkay Yılmaz",
        password_hash=get_password_hash("123456"),
        department="İnsan Kaynakları",
        salary=45000.0,
        start_date=datetime(2022, 5, 15),
        hr_cert_no="HR-998877",
        type="ik_yönetici",
        is_active=True
    )

    # 3. Personel: Can Demir
    employee = Employee(
        username="can.demir",
        email="can.demir@sirket.com",
        first_name="Can",
        last_name="Demir",
        full_name="Can Demir",
        password_hash=get_password_hash("123456"),
        department="Yazılım",
        salary=35000.0,
        start_date=datetime(2024, 3, 10),
        type="personel",
        is_active=True
    )

    db.add(owner)
    db.flush() # ID almak için flush et (RETURNING yoksa)
    
    db.add(hr_manager)
    db.flush()
    
    db.add(employee)
    db.flush()

    # İzinler (Kayıt sonrası ID'ler oluşunca ekleyelim veya ilişki ile)
    # İlişki ile ekleyelim
    
    leave1 = LeaveRequest(
        user_id=hr_manager.id,
        leave_type="Yıllık İzin",
        start_date=datetime(2026, 8, 1),
        end_date=datetime(2026, 8, 15),
        total_days=14,
        status="approved",
        reason="Yaz tatili"
    )
    db.add(leave1)
    db.flush()

    # Can Demir İzinleri
    leave2 = LeaveRequest(
        user_id=employee.id,
        leave_type="Sağlık",
        start_date=datetime(2026, 2, 10),
        end_date=datetime(2026, 2, 12),
        total_days=2,
        status="pending",
        reason="Grip"
    )
    db.add(leave2)
    db.flush()
    
    db.commit()
    print("✅ Veriler eklendi.")

    # --- Doğrulama ve Çıktı ---
    print("\n--- JSON ÇIKTISI ---")
    
    db.refresh(owner)
    db.refresh(hr_manager)
    db.refresh(employee)

    # Helper function to match exact requested JSON format
    def format_output(pydantic_obj):
        data = pydantic_obj.model_dump()
        
        # Tarih formatlama
        if data.get('ise_baslama_tarihi'):
            data['ise_baslama_tarihi'] = data['ise_baslama_tarihi'].strftime('%Y-%m-%d')
            
        # İzinler düzenleme
        new_leaves = []
        for leave in data.get('izinler', []):
            new_leave = {
                "id": leave['id'],
                "tip": leave['tip'],
                "baslangic": leave['baslangic'].strftime('%Y-%m-%d'),
                "bitis": leave['bitis'].strftime('%Y-%m-%d'),
                "durum": "Onaylandı" if leave['durum'] == 'approved' else "Beklemede" if leave['durum'] == 'pending' else "Reddedildi"
            }
            new_leaves.append(new_leave)
        data['izinler'] = new_leaves
        
        return data

    output = [
        format_output(FirmaSahibi.model_validate(owner)),
        format_output(IKYonetici.model_validate(hr_manager)),
        format_output(Personel.model_validate(employee))
    ]
    
    print(json.dumps(output, ensure_ascii=False, indent=2))
    db.close()

if __name__ == "__main__":
    seed_data()
