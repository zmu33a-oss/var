require('./scripts/load-env.cjs');
const { Client, Account } = require('node-appwrite');

const endpoint = process.env.APPWRITE_ENDPOINT || process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT;
const project = process.env.APPWRITE_PROJECT_ID || process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID;

const client = new Client().setEndpoint(endpoint).setProject(project);
const account = new Account(client);

const testPasswords = ['Test123!', 'test123', '123456', 'password'];

(async () => {
  for (const pass of testPasswords) {
    try {
      const session = await account.createEmailPasswordSession('zmu33a@gmail.com', pass);
      console.log('✓ نجح تسجيل الدخول بكلمة المرور:', pass.substring(0, 3) + '***');
      console.log('Session userId:', session.userId);
      
      const response = await fetch('http://localhost:3000/api/admin/index?section=me', {
        headers: {
          'x-appwrite-session': session.secret
        }
      });
      const data = await response.json();
      console.log('\nنتيجة admin /me:');
      console.log(JSON.stringify(data, null, 2));
      
      await account.deleteSession('current');
      return;
    } catch (error) {
      console.log('✗ فشل مع', pass + ':', error.message);
    }
  }
  console.log('\n❌ جميع كلمات المرور فشلت - يجب إعادة تعيين كلمة المرور');
})();
