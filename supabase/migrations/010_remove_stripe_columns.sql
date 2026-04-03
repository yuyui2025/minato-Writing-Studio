-- Stripe 課金連携を廃止（#212）のため不要カラムを削除
-- Pro プランは管理者による手動変更のみで運用する

alter table user_profiles
  drop column if exists stripe_customer_id,
  drop column if exists stripe_subscription_id;
