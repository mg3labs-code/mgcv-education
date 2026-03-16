const GradientMeshBg = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
    {/* Mesh gradient orbs */}
    <div className="absolute -top-[30%] -left-[10%] w-[60vw] h-[60vw] rounded-full bg-[radial-gradient(circle,hsl(162_65%_38%/0.15)_0%,transparent_70%)] blur-3xl animate-mesh-float-1" />
    <div className="absolute top-[20%] -right-[15%] w-[50vw] h-[50vw] rounded-full bg-[radial-gradient(circle,hsl(210_65%_52%/0.12)_0%,transparent_70%)] blur-3xl animate-mesh-float-2" />
    <div className="absolute -bottom-[20%] left-[20%] w-[45vw] h-[45vw] rounded-full bg-[radial-gradient(circle,hsl(280_60%_55%/0.08)_0%,transparent_70%)] blur-3xl animate-mesh-float-3" />
    {/* Noise texture overlay */}
    <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }} />
  </div>
);

export default GradientMeshBg;
