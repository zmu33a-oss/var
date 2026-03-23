function XPage() {
  return (
    <div className="min-h-screen bg-black text-white flex justify-center pt-10">
      <div className="w-[400px]">
        {/* بوست */}
        <div className="border-b border-zinc-700 p-4">
          <p className="font-bold">@user</p>
          <p className="mt-2">هذا بوست تجريبي في صفحة X 🚀</p>
        </div>

        {/* بوست ثاني */}
        <div className="border-b border-zinc-700 p-4">
          <p className="font-bold">@another_user</p>
          <p className="mt-2">تجربة ثانية للمحتوى ✨</p>
        </div>
      </div>
    </div>
  );
}

export default XPage;
