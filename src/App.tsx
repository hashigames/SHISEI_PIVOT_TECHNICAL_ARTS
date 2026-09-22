/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Upload, 
  Trash2, 
  Edit3, 
  Lock, 
  Unlock, 
  Database, 
  Image as ImageIcon, 
  Wand2, 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Plus,
  Sword,
  User,
  Zap,
  LayoutGrid,
  Sparkles,
  Loader2,
  Layers,
  Maximize2,
  Save,
  Search,
  Camera,
  Table,
  List,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Eye,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import PoseAnalyzer from './components/PoseAnalyzer';
import ImagePrep from './components/ImagePrep';
import CharacterCustomization from './components/CharacterCustomization';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// --- Translations ---
const translations: Record<string, Record<string, string>> = {
  en: {
    nav_prep: "Image Prep",
    nav_synthesis: "Pose Synthesis",
    nav_customization: "Character Creator",
    nav_library: "Action Library",
    nav_weapons: "Weapon Store",
    nav_forge: "Retarget Forge",
    nav_admin: "Admin Terminal",
    op_mode: "Operation Mode",
    sys_status: "System Status",
    core_active: "SYSTEM CORE ACTIVE",
    forge_retarget: "Kinematic_Retargeting",
    asset_mgmt: "Asset_Management",
    forge_header: "Kinematic_Forge",
    forge_subheader: "Guided_Asset_Synthesis",
    studio_header: "Kinematic_Synthesis_Lab",
    studio_subheader: "Prototype_Fabrication_Hub",
    ready_synthesis: "Ready_For_Synthesis",
    synthesis_desc: "Input prompt and initiate fabrication sequence",
    asset_lib: "Asset Library",
    motion_db: "Motion Verb Database",
    forge_h: "Kinematic Forge",
    forge_sh: "Guided Asset Synthesis",
    all: "All",
    retarget_eng: "Retargeting_Engine",
    fusion_proc: "Fusion_Processor",
    motion_comp: "Motion_Composer",
    retarget_desc: "Apply pose to reference",
    fusion_desc: "Synthesize weaponry",
    motion_desc: "Interpolate keyframes",
    input_params: "INPUT_PARAMETERS",
    weapon_db: "Weapon Database",
    weapon_storage: "Static Instance Storage",
    weapon_class: "Class: Weaponry_Static",
    instance: "Instance",
    active_verb: "Active Verb",
    buffer_depth: "Buffer Depth",
    concept_class: "Concept Class",
    pointer_index: "Pointer Index",
    edit_seq: "Edit Sequence",
    export_pkg: "Export Package",
    close_session: "Close Session",
    assets_count: "Assets",
    studio_data: "STUDIO_DATA",
    auth_terminal: "AUTH_TERMINAL",
    establish_auth: "ESTABLISH_AUTH",
    abort: "ABORT_PROTOCOL",
    processing: "PROCESSING_SEQUENCE...",
    engage_retarget: "ENGAGE_RETARGET",
    select_db: "-- SELECT_DB_ENTRY --",
    instance_select: "Instance_Select (MIN_2)",
    synthesis_logic: "SYNTHESIS_LOGIC: SYSTEM WILL DERIVE HYBRID ATTRIBUTES FROM SELECTED SOURCES.",
    synthesizing: "SYNTHESIZING_INSTANCE...",
    execute_fusion: "EXECUTE_FUSION",
    interpolate: "INTERPOLATE_MOTION",
    interpolating: "BRIDGING_KEYFRAMES...",
    drop_char: "Drop Character Reference",
    char_types: "(Bipedal/Mech/Monster)",
    output_stream: "OUTPUT_STREAM",
    buffer_status: "Buffer_Status",
    status_processing: "Processing",
    status_verified: "Verified",
    status_standby: "Standby",
    pathmapping: "Kinematic Pathmapping...",
    save_asset: "SAVE_ASSET",
    standby_synth: "Standby_For_Kinematic_Synthesis",
    synthesis_intent: "Synthesis_Intent",
    describe_pose: "Describe pose...",
    gen_seq: "GENERATE_SEQUENCE",
    action_type: "Action",
    text_type: "Text",
    restricted: "RESTRICTED_ACCESS",
    auth_req: "Authorization Level 4 Required / Sakura_Ronin_Auth",
    confirm_del: "Confirm permanent deletion of motion verb sequence?",
    admin_title_action: "LOG_MOTION_VERB",
    admin_title_weapon: "LOG_WEAPON_INSTANCE",
    field_admin_id: "ADMIN_IDENTIFIER",
    field_security_hash: "SECURITY_HASH",
    proto_ready: "SYNTHESIS_ENGINE_READY",
    proto_desc: "Input parameters and engage fabrication sequence",
    proto_nodes: "Nodes",
    proto_exec: "Execute_Synthesis",
    proto_fabrication: "Fabricated_Prototypes_Array",
    proto_committing: "Committing...",
    proto_no_ref: "No_Reference_Selected",
    proto_unnamed: "UNNAMED_PROTOTYPE",
    proto_hi_fi: "Sakura_Generated / High_Fidelity_Synthesis",
    status_stable: "桜プロセッサ安定",
    proto_h: "Prototype Studio",
    proto_sh: "Synthetic Motion Reference Generation",
    proto_input: "Synthesis Prompt",
    proto_reference: "Action Reference Source",
    proto_variation: "Variation Engine",
    proto_generate: "Generate",
    proto_add_db: "Add to Database",
    synthesis_stage: "PIPELINE STAGE 01",
    synthesis_title: "SHISEI CORE: CHARACTER ALIGNMENT & POSE SYNTHESIS",
    synthesis_subtitle: "Validate character contours, verify species anatomy layout, and proceduralize custom keyframe poses.",
    pivot_matrix: "PIVOT MATRIX:",
    ref_char_input: "Reference Character Input",
    drag_drop_char: "Drag & Drop Character Picture Here",
    supported_formats: "Supports: JPEG, JPG, PNG (Max 10MB)",
    browse_local_files: "Browse Local Files",
    change_image: "Change Image",
    stance_category: "Stance Extremity Category",
    human_biped_opt: "Human Biped (Male, Female)",
    creature_biped_opt: "Creature Biped / Alien Hum",
    quadruped_opt: "Quadruped / 4-Legged Creature",
    triple_extremities_opt: "Triple Extremities / Mutant",
    verifying_posture: "Verifying Structural Posture...",
    analyze_validate_btn: "Analyze & Validate Portrait",
    integrity_audit: "Integrity Audit: ",
    passed_stable: "PASSED_STABLE",
    rejected_incomplete: "REJECTED_INCOMPLETE",
    complete_body: "Complete Body?",
    category_match: "Category Match?",
    yes_complete: "YES [100%]",
    no_crop: "NO (Incomplete Crop)",
    strict_match: "STRICT MATCH [OK]",
    mismatch_corrected: "MISMATCH (AI Corrected)",
    pose_motion_settings: "Pose & Motion Alignment Set",
    biped_detected: "Biped Character Detected",
    convert_desc_biped: "Convert character illustration to a standard structural T or V animation pose.",
    pose_mode_t: "T-Pose",
    pose_mode_v: "V-Pose",
    pose_mode_off: "Alignment Off",
    quadruped_detected: "Quadruped / Tripiled Configuration",
    convert_desc_quadruped: "Quadrupeds and triple-extremity mutants do not require alignment posture conversion. Movement states are proceduralized onto original layout angles directly.",
    convert_target_motion: "Convert to Target Dynamic Motion",
    pose_references_title: "Pose References (Shisei Anchor Frames)",
    imitate_pose_subtitle: "Imitate pose silhouette",
    upload_pose_ref: "Upload Pose Reference",
    url_placeholder: "Or paste picture URL...",
    add_ref_btn: "Add",
    generating_poses_btn_active: "SHISEI SHIFT: IMMERGING POSITIONS...",
    generate_poses_btn: "Generate 10 Pose Variations",
    seeding_engine_active: "SHISEI SEEDING ENGINE ACTIVE",
    process_state: "PROCESS STATE",
    sequentially_synthesizing: "Synthesizing multiple variant frames sequentially...",
    synthesized_boneset: "SYNTHESIZED BONESET ARRAY",
    gen_keyframe_varieties: "Generated Keyframe Varieties",
    motion_context: "Motion Context",
    synthesis_output_desc: "Below are 10 unique poses generated using your character reference and ",
    shisei_ref_used: "provided custom pose silhouettes",
    implicit_archetypes: "implicit movement archetypes",
    to_proceduralize: ". Use the cards to rotate, zoom in/out/pan, or download each sprite sheet coordinate block.",
    frame_label: "FRAME 0",
    rotate_tooltip: "Rotate 90 degrees clockwise",
    zoom_out_tooltip: "Zoom Out",
    zoom_in_tooltip: "Zoom In",
    download_spec: "Download Spec",
    interactive_zoom: "Interactive pan & zoom modal",
    shisei_zoom_module: "SHISEI ZOOM MODULE",
    scale_factor: "Scale factor: ",
    drag_to_pan: "Drag image to pan model details.",
    close_btn: "Close ✕",
    drag_mouse_help: "Drag Mouse to Pan Vertices",
    zoom_lever: "Zoom Lever",
    reset_centroid: "Reset Centroid",
    bg_toggle_label: "Original Background",
    bg_toggle_desc: "Keep original background context or isolate character",
    bg_on: "BKG ON",
    bg_off: "BKG OFF",
  },
  jp: {
    nav_prep: "画像準備 (Prep)",
    nav_synthesis: "ポーズ・姿勢合成",
    nav_customization: "キャラカスタマイズ",
    nav_library: "モーションライブラリ",
    nav_weapons: "武器ストア",
    nav_forge: "リターゲット・フォージ",
    nav_admin: "管理ターミナル",
    op_mode: "動作モード",
    sys_status: "システムステータス",
    core_active: "システムコア稼働中",
    forge_retarget: "キネマティック・リターゲット",
    asset_mgmt: "資産管理モード",
    forge_header: "キネマティック・フォージ",
    forge_subheader: "ガイド付きアセット合成",
    studio_header: "キネマティック・合成室",
    studio_subheader: "試作機製作ハブ",
    ready_synthesis: "合成準備完了",
    synthesis_desc: "プロンプトを入力して製作シーケンスを開始してください",
    asset_lib: "アセットライブラリ",
    motion_db: "モーション動詞データベース",
    forge_h: "キネマティック・フォージ",
    forge_sh: "ガイド付きアセット合成",
    all: "すべて",
    retarget_eng: "リターゲット・エンジン",
    fusion_proc: "フュージョン・プロセッサ",
    motion_comp: "モーション・コンポーザー",
    retarget_desc: "ポーズをリファレンスに適用",
    fusion_desc: "武器を合成する",
    motion_desc: "キーフレームを補間する",
    input_params: "入力パラメータ",
    weapon_db: "武器データベース",
    weapon_storage: "静的インスタンスストレージ",
    weapon_class: "クラス: 武器静的モデル",
    instance: "インスタンス",
    active_verb: "現在のアクション",
    buffer_depth: "バッファ深度",
    concept_class: "コンセプトクラス",
    pointer_index: "ポインタインデックス",
    edit_seq: "シーケンス編集",
    export_pkg: "パッケージ書き出し",
    close_session: "セッション終了",
    assets_count: "アセット",
    studio_data: "スタジオデータ",
    auth_terminal: "認証ターミナル",
    establish_auth: "認証確立",
    abort: "中断",
    processing: "シーケンス処理中...",
    engage_retarget: "リターゲット開始",
    select_db: "-- データベース項目を選択 --",
    instance_select: "インスタンス選択 (最小2つ)",
    synthesis_logic: "合成ロジック: システムが選択されたソースからハイブリッド属性を派生させます。",
    synthesizing: "インスタンス合成中...",
    execute_fusion: "フュージョン実行",
    interpolate: "モーション補間",
    interpolating: "キーフレーム橋渡し中...",
    drop_char: "キャラクターリファレンスをドロップ",
    char_types: "(二足歩行/メカ/モンスター)",
    output_stream: "出力ストリーム",
    buffer_status: "バッファステータス",
    status_processing: "処理中",
    status_verified: "検証済み",
    status_standby: "待機中",
    pathmapping: "キネマティック・パスマッピング中...",
    save_asset: "アセット保存",
    standby_synth: "プロセッサ合成待機中",
    synthesis_intent: "合成意図",
    describe_pose: "ポーズを説明...",
    gen_seq: "シーケンス生成",
    action_type: "アクション",
    text_type: "テキスト",
    restricted: "制限されたアクセス",
    auth_req: "認可レベル4が必要です / 桜浪人認証",
    confirm_del: "モーション動詞シーケンスを永久に削除しますか？",
    status_online: "ステータス: オンライン",
    processor_stable: "桜プロセッサ安定",
    auth_sakura: "認証: 桜",
    auth_ronin: "認証: 浪人",
    admin_title_action: "モーション動詞ログ",
    admin_title_weapon: "武器インスタンスログ",
    field_verb: "動詞識別子",
    field_category: "カテゴリータグ",
    field_frames: "モーションフレームデータ",
    field_zero_frames: "フレームが割り当てられていません",
    field_upload_batch: "新しいフレームの一括アップロード",
    field_weapon_id: "武器識別子",
    field_asset_inst: "ビジュアルアセットインスタンス",
    field_upload_static: "静的アセットのアップロード",
    btn_abort: "タスク中止",
    btn_commit: "データベース確定",
    btn_finalize: "ログ完了",
    proto_h: "プロトタイプスタジオ",
    proto_sh: "合成モーションリファレンス生成",
    proto_input: "合成プロンプト",
    proto_reference: "アクション参照ソース",
    proto_variation: "バリエーションエンジン",
    proto_generate: "合成開始",
    proto_add_db: "データベースに追加",
    field_admin_id: "管理用識別子",
    field_security_hash: "セキュリティハッシュ",
    proto_ready: "合成エンジン準備完了",
    proto_desc: "パラメータを入力して製作シーケンスを開始してください",
    proto_nodes: "ノード",
    proto_exec: "合成実行",
    proto_fabrication: "製作プロトタイプ配列",
    proto_committing: "確定中...",
    proto_no_ref: "参照が選択されていません",
    proto_unnamed: "名称未設定プロトタイプ",
    proto_hi_fi: "桜生成 / 高忠実度合成",
    status_stable: "桜プロセッサ安定",
    synthesis_stage: "パイプラインステージ 01",
    synthesis_title: "姿勢コア：キャラクターアライメント＆ポーズ合成",
    synthesis_subtitle: "キャラクターの輪郭検証、骨格構造の確認、およびカスタムキーフレームポーズの合成を行います。",
    pivot_matrix: "アライメントマトリクス:",
    ref_char_input: "キャラクター参照画像入力",
    drag_drop_char: "キャラクター画像をここにドラッグ＆ドロップしてください",
    supported_formats: "対応形式: JPEG, JPG, PNG (最大10MB)",
    browse_local_files: "ローカルファイルをブラウズ",
    change_image: "画像を変更",
    stance_category: "姿勢・四肢構成カテゴリ",
    human_biped_opt: "人型二足歩行 (男性・女性)",
    creature_biped_opt: "クリーチャー二足歩行 / 亜人メカ",
    quadruped_opt: "四足歩行 / 四肢獣型・動物",
    triple_extremities_opt: "三肢構成 / 変異体エイリアン",
    verifying_posture: "骨格構造を解析 & 検証中...",
    analyze_validate_btn: "ポートレートを解析 & 検証",
    integrity_audit: "整合性監査: ",
    passed_stable: "合格_安定",
    rejected_incomplete: "不合格_不完全",
    complete_body: "全身が写っているか？",
    category_match: "カテゴリの一致？",
    yes_complete: "はい [100%]",
    no_crop: "いいえ (トリミング不完全)",
    strict_match: "厳密な一致 [OK]",
    mismatch_corrected: "不一致 (AIによる補正済み)",
    pose_motion_settings: "ポーズ＆モーションアライメント設定",
    biped_detected: "二足歩行キャラクター検出",
    convert_desc_biped: "キャラクターのイラストを、標準的な骨格のTポーズまたはVポーズに変換します。",
    pose_mode_t: "Tポーズ",
    pose_mode_v: "Vポーズ",
    pose_mode_off: "アライメントなし (オフ)",
    quadruped_detected: "四足歩行またはその他特殊構成",
    convert_desc_quadruped: "四肢獣および三肢構成の変異体は、整列用のポーズ変換を必要としません。移動状態は、元の配置角度に直接プロシージャルとして適用されます。",
    convert_target_motion: "対象の動的モーションへ変換",
    pose_references_title: "姿勢参照 (Shisei アンカーフレーム)",
    imitate_pose_subtitle: "ポーズシルエットの模倣",
    upload_pose_ref: "姿勢参照画像をアップロード",
    url_placeholder: "または画像のURLを入力...",
    add_ref_btn: "追加",
    generating_poses_btn_active: "姿勢シフト：アニメーション位置を合成中...",
    generate_poses_btn: "10つのポーズバリエーションを生成",
    seeding_engine_active: "SHISEI生成シードエンジン稼働中",
    process_state: "プロセスステータス",
    sequentially_synthesizing: "複数の個別フレームバリエーションを順次生成・合成しています...",
    synthesized_boneset: "合成済キネマティック・ボーンセット配列",
    gen_keyframe_varieties: "生成されたキーフレームバリエーション",
    motion_context: "モーションコンテキスト",
    synthesis_output_desc: "以下は、あなたのキャラクター参照画像と",
    shisei_ref_used: "提供されたカスタム姿勢シルエット",
    implicit_archetypes: "暗黙的な動作パターン",
    to_proceduralize: "に基づいて生成された10のユニークなポーズです。カードを使って、それぞれのスプライトシート・骨格座標ブロックを回転、ズームイン/ズームアウト/移動、またはダウンロードできます。",
    frame_label: "フレーム 0",
    rotate_tooltip: "時計回りに90度回転",
    zoom_out_tooltip: "縮小",
    zoom_in_tooltip: "拡大",
    download_spec: "画像ダウンロード",
    interactive_zoom: "インタラクティブ拡大＆スクロール表示",
    shisei_zoom_module: "SHISEIズーム詳細モジュール",
    scale_factor: "拡大率：",
    drag_to_pan: "ドラッグしてモデルの詳細位置をスクロールできます。",
    close_btn: "閉じる ✕",
    drag_mouse_help: "マウスをドラッグして関節頂点を移動",
    zoom_lever: "ズームレバー",
    reset_centroid: "原点リセット",
    bg_toggle_label: "元の背景オプション",
    bg_toggle_desc: "アップロード画像の背景を保持するか、キャラクターのみを抽出するかを選択します",
    bg_on: "背景あり",
    bg_off: "背景なし (透過/抽出)",
  }
};

// --- Types ---
interface Action {
  id: string;
  category: string;
  verb_name: string;
  sub_action: string;
  hand_object: string;
  frame_count: number;
  frame_delay: number;
  notes: string;
  thumbnail_path: string | null;
  frames_json: string; // JSON array of paths
}

interface Weapon {
  id: string;
  name: string;
  category: string;
  hand_grip: string;
  description: string;
  thumbnail_path: string | null;
  image_path: string | null;
  images_json?: string;
}

interface GeneratedAsset {
  id: string;
  original_input_image: string;
  output_image_path: string;
  action_id: string;
  timestamp: string;
}

// --- App Component ---
export default function App() {
  const [activeTab, setActiveTab] = useState<'synthesis' | 'gallery' | 'forge' | 'admin' | 'weapons' | 'prep' | 'customization'>('prep');
  const [prepCharacterRef, setPrepCharacterRef] = useState<string | null>(null);
  const [prepPoseRefs, setPrepPoseRefs] = useState<{ id: string; name: string; url: string }[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [lang, setLang] = useState<'en' | 'jp'>('en');

  const t = (key: string) => translations[lang][key] || key;
  const [actions, setActions] = useState<Action[]>([]);
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [selectedAction, setSelectedAction] = useState<Action | null>(null);
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [editingAction, setEditingAction] = useState<Partial<Action> | null>(null);
  const [editingWeapon, setEditingWeapon] = useState<Partial<Weapon> | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Load Data
  const fetchData = async () => {
    try {
      const actionsRes = await fetch('/api/actions');
      const weaponsRes = await fetch('/api/weapons');
      setActions(await actionsRes.json());
      setWeapons(await weaponsRes.json());
    } catch (err) {
      console.error("Failed to fetch data:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="flex h-screen w-full bg-theme-bg text-theme-text font-sans overflow-hidden">
      {/* Left Sidebar Navigation */}
      <div className="w-64 flex-shrink-0 bg-theme-surface border-r border-theme-border flex flex-col relative overflow-hidden">
        {/* Decorative Sakura Accent */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-theme-accent/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="p-6 relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-theme-accent rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(255,183,197,0.6)] border border-white overflow-hidden p-1 bg-gradient-to-tr from-theme-accent to-[#8FE3F1]">
              <LighthouseLogo className="text-white w-7 h-7 animate-bounce" />
            </div>
            <h1 className="text-lg font-black tracking-tight uppercase leading-tight italic text-theme-text">
              SHISEI PIVOT <span className="text-theme-accent">姿勢</span><br/><span className="text-[9px] text-theme-accent font-mono tracking-[0.2em] not-italic font-bold uppercase truncate">Animation Studio V1.0</span>
            </h1>
          </div>

          {/* Language Toggle */}
          <div className="mb-6 flex gap-1 p-1 bg-theme-bg/50 rounded-lg border border-theme-border">
            <button 
              onClick={() => setLang('en')}
              className={`flex-1 py-1 text-[8px] font-black rounded transition-all ${lang === 'en' ? 'bg-theme-accent text-white shadow-sm' : 'text-theme-muted hover:text-theme-text'}`}
            >EN</button>
            <button 
              onClick={() => setLang('jp')}
              className={`flex-1 py-1 text-[8px] font-black rounded transition-all ${lang === 'jp' ? 'bg-theme-accent text-white shadow-sm' : 'text-theme-muted hover:text-theme-text'}`}
            >JP</button>
          </div>
          
          <nav className="space-y-1">
            <NavItem 
              number="00" 
              label={t('nav_prep')}
              active={activeTab === 'prep'} 
              onClick={() => setActiveTab('prep')} 
            />
            <NavItem 
              number="01" 
              label={t('nav_synthesis')}
              active={activeTab === 'synthesis'} 
              onClick={() => setActiveTab('synthesis')} 
            />
            <NavItem 
              number="02" 
              label={t('nav_customization')}
              active={activeTab === 'customization'} 
              onClick={() => setActiveTab('customization')} 
            />
            <NavItem 
              number="03" 
              label={t('nav_library')}
              active={activeTab === 'gallery'} 
              onClick={() => setActiveTab('gallery')} 
              count={actions.length}
            />
            <NavItem 
              number="04" 
              label={t('nav_weapons')}
              active={activeTab === 'weapons'} 
              onClick={() => setActiveTab('weapons')} 
              count={weapons.length}
            />
            <NavItem 
              number="05" 
              label={t('nav_forge')}
              active={activeTab === 'forge'} 
              onClick={() => setActiveTab('forge')} 
            />
            <NavItem 
              number="06" 
              label={t('nav_admin')}
              active={activeTab === 'admin'} 
              onClick={() => setActiveTab('admin')} 
            />
          </nav>
        </div>
        
        <div className="mt-auto p-6 border-t border-theme-border bg-theme-bg/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-theme-accent-blue border border-white overflow-hidden shadow-sm">
                <div className="w-full h-full bg-gradient-to-tr from-theme-accent-blue to-white/50"></div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-tight text-theme-text">ADMIN_USER</p>
                <p className="text-[9px] text-theme-accent uppercase font-mono font-bold tracking-widest">{isAdmin ? t('auth_sakura') : t('auth_ronin')}</p>
              </div>
            </div>
            <button 
              onClick={() => isAdmin ? setIsAdmin(false) : setAuthModalOpen(true)}
              className={`p-2 rounded-lg transition-all ${isAdmin ? 'text-theme-accent hover:bg-theme-accent/10' : 'text-theme-muted hover:bg-white/5'}`}
            >
              {isAdmin ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex flex-col relative overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-theme-border bg-white flex items-center justify-between px-8 z-10">
          <div className="flex gap-8">
            <div className="flex flex-col">
              <span className="text-[9px] text-theme-muted uppercase font-mono tracking-widest font-bold">{t('op_mode')}</span>
              <span className="text-xs font-bold uppercase text-theme-text">{activeTab === 'forge' ? t('forge_retarget') : t('asset_mgmt')}</span>
            </div>
            <div className="flex flex-col border-l border-theme-border pl-8">
              <span className="text-[9px] text-theme-muted uppercase font-mono tracking-widest font-bold">{t('sys_status')}</span>
              <span className="text-xs font-bold text-theme-accent-blue uppercase">{t('core_active')}</span>
            </div>
          </div>
          <div className="flex gap-4">
             <div className="text-[10px] items-center flex font-mono text-theme-muted uppercase tracking-tighter">
               GMT {new Date().toISOString().split('T')[1].split('.')[0]}
             </div>
          </div>
        </header>

        {/* Workspace */}
        <main className="flex-grow overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'prep' && (
              <motion.div key="prep" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <ImagePrep 
                  t={t} 
                  lang={lang}
                  onAddToPoseReferences={(url, name) => {
                    setPrepPoseRefs(prev => [...prev, { id: `crop_${Date.now()}`, name, url }]);
                    setActiveTab('synthesis');
                  }}
                  onSetAsCharacterReference={(url) => {
                    setPrepCharacterRef(url);
                    setActiveTab('synthesis');
                  }}
                />
              </motion.div>
            )}

            {activeTab === 'synthesis' && (
              <motion.div key="synthesis" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <PoseAnalyzer 
                  actions={actions} 
                  t={t} 
                  onRefresh={fetchData}
                  initialFilePreview={prepCharacterRef}
                  initialPoseReferences={prepPoseRefs}
                  onClearInitialPreview={() => setPrepCharacterRef(null)}
                  onClearInitialRefs={() => setPrepPoseRefs([])}
                />
              </motion.div>
            )}

            {activeTab === 'customization' && (
              <motion.div key="customization" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <CharacterCustomization 
                  t={t} 
                  lang={lang}
                  initialInputImage={prepCharacterRef}
                  onSetAsCharacterReference={(url) => {
                    setPrepCharacterRef(url);
                    setActiveTab('synthesis');
                  }}
                  onRefresh={fetchData}
                />
              </motion.div>
            )}

            {activeTab === 'gallery' && (
              <motion.div key="gallery" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Gallery 
                  actions={actions} 
                  onSelect={setSelectedAction} 
                  onAdd={() => { setEditingAction({}); setActiveTab('admin'); }}
                  isAdmin={isAdmin}
                  onRefresh={fetchData}
                  t={t} 
                />
              </motion.div>
            )}

            {activeTab === 'weapons' && (
              <motion.div key="weapons" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <WeaponGallery weapons={weapons} onSelect={setSelectedWeapon} t={t} />
              </motion.div>
            )}

            {activeTab === 'forge' && (
              <motion.div key="forge" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <KinematicForge actions={actions} weapons={weapons} t={t} />
              </motion.div>
            )}

            {activeTab === 'admin' && (
              <motion.div key="admin" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <AdminDashboard 
                  isAdmin={isAdmin} 
                  actions={actions} 
                  weapons={weapons} 
                  onRefresh={fetchData} 
                  editingAction={editingAction}
                  setEditingAction={setEditingAction}
                  editingWeapon={editingWeapon}
                  setEditingWeapon={setEditingWeapon}
                  t={t}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        <footer className="h-8 bg-theme-accent text-white flex items-center justify-between px-6 font-mono text-[9px] font-bold z-10 shadow-[0_-4px_10px_rgba(255,183,197,0.2)]">
          <div className="flex gap-6 uppercase">
            <span>CORE: FLASH_SAKURA</span>
            <span>NODES: {actions.length + weapons.length}</span>
            <span>{t('status_online')}</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="animate-pulse">🌸</span>
            <span>{t('processor_stable')}</span>
          </div>
        </footer>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {selectedAction && (
          <ActionPlayer 
            action={actions.find(a => a.id === selectedAction.id) || selectedAction} 
            isAdmin={isAdmin}
            onEdit={() => {
              const currentAction = actions.find(a => a.id === selectedAction.id) || selectedAction;
              setEditingAction(currentAction);
              setActiveTab('admin');
              setSelectedAction(null);
            }}
            onClose={() => setSelectedAction(null)} 
            onRefresh={fetchData}
            t={t}
          />
        )}
        
        {selectedWeapon && (
          <WeaponPlayer
            weapon={weapons.find(w => w.id === selectedWeapon.id) || selectedWeapon}
            isAdmin={isAdmin}
            onClose={() => setSelectedWeapon(null)}
            onRefresh={fetchData}
            t={t}
          />
        )}
        
        {authModalOpen && (
          <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} onLogin={() => setIsAdmin(true)} t={t} />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- UI Components ---

// --- Tooltip Component ---
function Tooltip({ children, content }: { children: React.ReactNode, content: string }) {
  const [show, setShow] = useState(false);

  return (
    <div 
      className="relative flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 5 }}
            transition={{ duration: 0.1 }}
            className="absolute z-[250] bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-theme-text text-theme-bg text-[8px] font-black uppercase tracking-widest rounded shadow-2xl shadow-theme-accent/20 whitespace-nowrap pointer-events-none border border-white/10"
          >
            {content}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-1.5 h-1.5 bg-theme-text rotate-45 -mt-0.5"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ number, label, active, onClick, count }: { number: string, label: string, active: boolean, onClick: () => void, count?: number }) {
  return (
    <Tooltip content={`${label} Module`}>
      <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-300 group ${active ? 'bg-theme-accent/10 text-theme-text border-l-4 border-theme-accent' : 'text-theme-muted hover:bg-theme-bg hover:text-theme-text'}`}
      >
        <span className={`text-[10px] font-mono transition-opacity font-bold ${active ? 'opacity-100 text-theme-accent' : 'opacity-40 group-hover:opacity-100'}`}>{number}</span>
        <span className="text-xs font-bold uppercase tracking-tight">{label}</span>
        {count !== undefined && (
          <span className="ml-auto text-[10px] bg-theme-border px-1.5 py-0.5 rounded text-theme-muted group-hover:text-theme-accent-blue transition-colors font-bold">
            {count}
          </span>
        )}
      </button>
    </Tooltip>
  );
}

function SectionHeading({ title, subtitle }: { title: string, subtitle?: string }) {
  return (
    <div className="mb-8 flex justify-between items-end border-b-2 border-theme-accent/20 pb-4">
      <div>
        <h2 className="text-2xl font-black uppercase tracking-tight text-theme-text italic flex items-center gap-3">
          {title} <span className="text-theme-accent-blue text-sm not-italic opacity-50">/ 0x</span>
        </h2>
        {subtitle && <p className="text-[10px] font-bold font-mono text-theme-accent uppercase tracking-[0.3em] mt-2">{subtitle}</p>}
      </div>
      <div className="w-12 h-1 bg-theme-accent-blue/30 rounded-full ml-auto hidden md:block"></div>
    </div>
  );
}


function Gallery({ actions, onSelect, onAdd, isAdmin, onRefresh, t }: { actions: Action[], onSelect: (a: Action) => void, onAdd: () => void, isAdmin: boolean, onRefresh?: () => void, t: any }) {
  const [viewMode, setViewMode] = useState<'spreadsheet' | 'grid'>('spreadsheet');
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [galleryError, setGalleryError] = useState<string | null>(null);

  useEffect(() => {
    if (galleryError) {
      const timer = setTimeout(() => setGalleryError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [galleryError]);
  
  const categories = ['All', ...new Set(actions.map(a => a.category))].sort();
  
  const filteredActions = actions.filter(a => {
    const matchesFilter = filter === 'All' || a.category === filter;
    const matchesSearch = 
      a.id.toLowerCase().includes(search.toLowerCase()) ||
      a.verb_name.toLowerCase().includes(search.toLowerCase()) || 
      a.category.toLowerCase().includes(search.toLowerCase()) ||
      (a.sub_action && a.sub_action.toLowerCase().includes(search.toLowerCase())) ||
      (a.hand_object && a.hand_object.toLowerCase().includes(search.toLowerCase())) ||
      (a.notes && a.notes.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  const exportToCSV = () => {
    const headers = ["ID", "Main Action Category", "Sub-action (Direction)", "Hand Object (Item)", "Frame Count", "Frame Delay (ms)", "Notes (FX / Japanese name)"];
    
    const csvRows = [
      headers.join(","),
      ...filteredActions.map(a => {
        const row = [
          a.id,
          a.category,
          a.sub_action,
          a.hand_object,
          a.frame_count,
          a.frame_delay,
          a.notes || ""
        ];
        return row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(",");
      })
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `lighthouse_${filter.replace(/[^a-zA-Z0-9]/g, '_')}_motion_data.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8">
      {/* Anime studio section header */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-theme-surface border border-theme-border p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <SectionHeading title="Dynamic Motion Library" subtitle="Japanese keyframe sequences database" />
          {isAdmin && (
            <button 
              onClick={() => onAdd()}
              className="px-6 py-2.5 bg-theme-accent text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-theme-accent/20 hover:bg-theme-text hover:shadow-none transition-all flex items-center gap-2"
            >
              <Plus className="w-3 h-3" /> New_Pose_Entry
            </button>
          )}
        </div>
        
        {/* Controls and Exporters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-muted" />
            <input 
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ID, action, FX notes..."
              className="w-full bg-theme-bg/85 border border-theme-border rounded-xl pl-10 pr-4 py-2 text-[10px] focus:outline-none focus:border-theme-accent transition-all text-theme-text font-mono placeholder:opacity-40"
            />
          </div>

          {/* Mode switch */}
          <div className="flex bg-theme-bg border border-theme-border p-1 rounded-xl">
            <button
              onClick={() => setViewMode('spreadsheet')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider ${viewMode === 'spreadsheet' ? 'bg-theme-surface text-theme-accent border border-theme-border shadow-sm' : 'text-theme-muted hover:text-theme-text'}`}
            >
              <Table className="w-3.5 h-3.5" />
              Spreadsheet
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider ${viewMode === 'grid' ? 'bg-theme-surface text-theme-accent border border-theme-border shadow-sm' : 'text-theme-muted hover:text-theme-text'}`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Cards
            </button>
          </div>

          {/* CSV Exporter */}
          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-[#E6BF5C] hover:bg-[#D4AC4B] text-theme-text border border-[#C69F3E] rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm shadow-[#E6BF5C]/20"
          >
            <Download className="w-3.5 h-3.5 text-theme-text animate-bounce-slow" />
            Excel Export (.CSV)
          </button>
        </div>
      </div>

      {/* Categories Bar */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-theme-surface/50 border border-theme-border rounded-xl overflow-x-auto max-w-full">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className={`px-4 py-1.5 rounded-lg text-[9px] uppercase font-bold tracking-wider transition-all whitespace-nowrap border ${filter === cat ? 'bg-theme-accent text-white border-theme-accent shadow-sm' : 'bg-transparent text-theme-muted hover:text-theme-text border-transparent'}`}
          >
            {cat === 'All' ? 'All Japanese Motion Categories' : cat}
          </button>
        ))}
      </div>

      {galleryError && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-xs rounded-xl flex items-center justify-between shadow-md animate-in slide-in-from-top duration-300">
          <div className="flex items-center gap-2">
            <span>⚠️</span>
            <span className="font-bold">{galleryError}</span>
          </div>
          <button onClick={() => setGalleryError(null)} className="text-red-400 hover:text-white font-bold opacity-60 hover:opacity-100 text-sm">&times;</button>
        </div>
      )}

      {/* Spreadsheet Presentation vs Grid Mode */}
      {viewMode === 'spreadsheet' ? (
        <div className="bg-theme-surface border border-theme-border rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse table-auto font-sans">
              <thead>
                <tr className="bg-theme-muted/5 border-b border-theme-border text-[9px] text-theme-muted uppercase tracking-widest font-mono font-black">
                  <th className="py-4 px-6 select-none">ID (識別子)</th>
                  <th className="py-4 px-4 select-none">Action Category</th>
                  <th className="py-4 px-4 select-none">Main Action (動作名)</th>
                  <th className="py-4 px-4 select-none">Sub-action Direction (サブ方向)</th>
                  <th className="py-4 px-4 select-none">Hand Object (装備)</th>
                  <th className="py-4 px-4 text-center select-none">Frames</th>
                  <th className="py-4 px-4 text-center select-none">Delay</th>
                  <th className="py-4 px-6 select-none">Notes (FX / Japanese Translation)</th>
                  <th className="py-4 px-6 text-right">Preview</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border-light text-[11px] text-theme-text font-medium">
                {filteredActions.map((action) => (
                  <tr 
                    key={action.id} 
                    onClick={() => onSelect(action)}
                    className="hover:bg-theme-accent/5 cursor-pointer transition-colors group align-middle"
                  >
                    <td className="py-3.5 px-6 font-mono font-bold text-theme-accent italic text-[11px] whitespace-nowrap">
                      {action.id}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-theme-muted whitespace-nowrap text-[8px] max-w-[120px] truncate" title={action.category}>
                      {action.category.replace(/Part \d+: /, '')}
                    </td>
                    <td className="py-3.5 px-4 uppercase font-black tracking-tight text-[11px] text-theme-text group-hover:text-theme-accent transition-colors">
                      <div className="flex items-center gap-2">
                        <span>{action.verb_name}</span>
                        <div className="flex items-center" onClick={(e) => e.stopPropagation()}>
                          <label className="p-1 hover:bg-[#FF5A79]/10 rounded-lg cursor-pointer transition-all text-[#FF5A79] opacity-0 group-hover:opacity-100 flex items-center justify-center border border-[#FF5A79]/25 hover:border-[#FF5A79]/60" title="Upload quick reference images for this action">
                            <Upload className="w-3 h-3 hover:scale-110" />
                            <input 
                              type="file" 
                              multiple 
                              className="hidden" 
                              onChange={async (e) => {
                                const files = e.target.files;
                                if (files && files.length > 0) {
                                  if (files.length > 5) {
                                    setGalleryError("Upload limit exceeded: You can only upload up to 5 images at a time.");
                                    e.target.value = '';
                                    return;
                                  }
                                  const formData = new FormData();
                                  for (let i = 0; i < files.length; i++) {
                                    formData.append("images", files[i]);
                                  }
                                  try {
                                    const res = await fetch(`/api/actions/${action.id}/upload`, {
                                      method: "POST",
                                      body: formData
                                    });
                                    const data = await res.json();
                                    if (data.success) {
                                      if (onRefresh) {
                                        onRefresh();
                                      }
                                      const updatedAction = {
                                        ...action,
                                        frame_count: data.frames.length,
                                        thumbnail_path: data.frames[0] || null,
                                        frames_json: JSON.stringify(data.frames)
                                      };
                                      onSelect(updatedAction); // Instantly open ActionPlayer on preview tabs!
                                    } else {
                                      setGalleryError(data.message || "Failed to upload reference images");
                                    }
                                  } catch (err) {
                                    console.error("Quick action upload failed:", err);
                                    setGalleryError("Something went wrong during upload");
                                  }
                                }
                              }} 
                            />
                          </label>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-theme-muted/90 font-mono text-[10px] max-w-[150px] truncate" title={action.sub_action}>
                      {action.sub_action}
                    </td>
                    <td className="py-3.5 px-4 text-theme-muted/90 font-mono text-[10px] max-w-[120px] truncate" title={action.hand_object}>
                      {action.hand_object}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-theme-accent-blue text-[11px]">
                      {action.frame_count}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-theme-muted text-[10px]">
                      {action.frame_delay}ms
                    </td>
                    <td className="py-3.5 px-6 italic text-theme-muted text-[10px] max-w-[200px] truncate" title={action.notes}>
                      {action.notes}
                    </td>
                    <td className="py-3.5 px-6 text-right whitespace-nowrap">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-theme-accent/10 text-theme-accent group-hover:bg-theme-accent group-hover:text-white transition-all transform scale-90 group-hover:scale-100 font-bold font-mono text-[9px]">
                        PLAY
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {filteredActions.map(action => (
            <ActionCard key={action.id} action={action} onClick={() => onSelect(action)} onRefresh={onRefresh} onError={setGalleryError} />
          ))}
        </div>
      )}

      {filteredActions.length === 0 && (
        <div className="text-center py-20 bg-theme-surface border border-theme-border rounded-2xl flex flex-col items-center gap-4">
          <Search className="w-12 h-12 text-theme-muted" />
          <p className="text-xs uppercase font-black tracking-widest font-mono text-theme-muted">No spreadsheet matches found</p>
        </div>
      )}
    </div>
  );
}

function ActionCard({ action, onClick, onRefresh, onError }: any) {
  const frames = JSON.parse(action.frames_json);
  
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group bg-theme-surface border border-theme-border rounded-xl overflow-hidden cursor-pointer hover:border-theme-accent/50 transition-all duration-300 shadow-sm hover:shadow-lg shadow-theme-accent/5 relative"
    >
      <div className="aspect-[3/4] bg-theme-bg relative overflow-hidden">
        {action.thumbnail_path ? (
          <img src={action.thumbnail_path} alt={action.verb_name} className="w-full h-full object-cover saturate-50 group-hover:saturate-100 transition-all duration-500" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-theme-accent/10">
            <ImageIcon className="w-10 h-10" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-transparent to-transparent opacity-60 pointer-events-none"></div>
        <div className="absolute top-2 right-2 flex gap-1 z-10">
          <span className="px-2 py-0.5 bg-white/90 backdrop-blur rounded text-[8px] border border-theme-border text-theme-accent-blue font-bold font-mono uppercase">
            FPS_{frames.length}
          </span>
        </div>

        {/* Hover direct upload button */}
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20"
          onClick={(e) => e.stopPropagation()}
        >
          <label className="px-3 py-1.5 bg-[#FF5A79] text-white hover:bg-[#FF456a] rounded-lg text-[8px] uppercase font-black tracking-widest transition-all transform scale-95 hover:scale-100 flex items-center gap-1 cursor-pointer shadow-lg shadow-black/35" title="Upload custom reference poses">
            <Upload className="w-3 h-3" />
            <span>Upload Reference</span>
            <input 
              type="file" 
              multiple 
              className="hidden" 
              onChange={async (e) => {
                const files = e.target.files;
                if (files && files.length > 0) {
                  if (files.length > 5) {
                    if (onError) {
                      onError("Upload limit exceeded: You can only upload up to 5 images at a time.");
                    }
                    e.target.value = '';
                    return;
                  }
                  const formData = new FormData();
                  for (let i = 0; i < files.length; i++) {
                    formData.append("images", files[i]);
                  }
                  try {
                    const res = await fetch(`/api/actions/${action.id}/upload`, {
                      method: "POST",
                      body: formData
                    });
                    const data = await res.json();
                    if (data.success) {
                      if (onRefresh) {
                        onRefresh();
                      }
                      onClick(); // Auto-open ActionPlayer modal
                    } else {
                      if (onError) onError(data.message || "Failed to upload reference images");
                    }
                  } catch (err) {
                    console.error("Direct ActionCard upload failed:", err);
                    if (onError) onError("Something went wrong during upload");
                  }
                }
              }} 
            />
          </label>
        </div>
      </div>
      <div className="p-4 border-t border-theme-border">
        <h3 className="text-[10px] uppercase tracking-widest font-black text-theme-text mb-1 truncate">{action.verb_name}</h3>
        <p className="text-[8px] uppercase tracking-[0.2em] text-theme-muted font-bold font-mono">{action.category}</p>
      </div>
    </motion.div>
  );
}

function WeaponCard({ weapon, onClick, t }: { weapon: Weapon; onClick?: () => void; t: any; key?: any }) {
  // Select matching graphic accents or icons based on weapon name/category
  const isFlashlight = weapon.name.toLowerCase().includes('flashlight') || weapon.name.toLowerCase().includes('torch');
  const isAerosol = weapon.name.toLowerCase().includes('aerosol') || weapon.name.toLowerCase().includes('spray');
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className="bg-theme-surface border border-theme-border rounded-xl overflow-hidden p-5 group hover:border-[#FF5A79]/50 transition-all duration-300 shadow-sm flex flex-col justify-between cursor-pointer"
    >
      <div>
        <div className="aspect-square bg-theme-bg/50 rounded-lg border border-theme-border flex items-center justify-center overflow-hidden mb-4 relative">
           {weapon.image_path ? (
             <img src={weapon.image_path} referrerPolicy="no-referrer" className="w-full h-full object-contain p-4 group-hover:scale-110 transition-transform duration-500 saturate-50 group-hover:saturate-100" />
           ) : (
             <Sword className="text-theme-accent/20 w-12 h-12 animate-pulse" />
           )}
           
           {/* Custom Badges or FX glows for Flashlight and Aerosol */}
           {isFlashlight && (
             <div className="absolute inset-0 bg-yellow-400/5 mix-blend-screen pointer-events-none group-hover:bg-yellow-400/10 transition-colors" />
           )}
           {isAerosol && (
             <div className="absolute inset-x-0 bottom-0 top-1/2 bg-gradient-to-t from-emerald-400/5 to-transparent pointer-events-none group-hover:from-emerald-400/15 transition-all" />
           )}

           <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-white/90 backdrop-blur text-[7px] font-extrabold font-mono text-theme-accent border border-theme-border rounded-full uppercase tracking-wider">
             {weapon.hand_grip || 'One-Handed'}
           </div>

           {/* Hover Visual Assist Indicator overlay */}
           <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
             <span className="px-3 py-1.5 bg-[#FF5A79] text-white rounded-lg text-[8px] font-mono tracking-widest font-black uppercase">
               WEAPON IMAGES STUDIO
             </span>
           </div>
        </div>
        
        <div className="space-y-1">
          <span className="text-[7.5px] px-1.5 py-0.5 rounded bg-theme-accent/5 border border-theme-accent-blue/15 text-theme-accent font-mono uppercase tracking-widest font-black inline-block">
            {weapon.category || 'Traditional'}
          </span>
          <h3 className="text-[11px] uppercase tracking-wider text-theme-text font-black truncate group-hover:text-theme-accent transition-colors" title={weapon.name}>
            {weapon.name}
          </h3>
        </div>
        
        <p className="text-[9px] text-theme-muted font-medium line-clamp-2 leading-relaxed mt-2.5 min-h-[2.2em]">
          {weapon.description || 'A custom synthesized armament crafted for defense.'}
        </p>
      </div>

      <div className="border-t border-theme-border/60 pt-3 mt-4 flex items-center justify-between text-[8px] font-mono text-theme-muted uppercase tracking-widest">
         <span>STATUS: ACTIVE</span>
         <span className="font-bold text-theme-accent">{weapon.id}</span>
      </div>
    </motion.div>
  );
}

function WeaponGallery({ weapons, onSelect, t }: { weapons: Weapon[], onSelect: (w: Weapon) => void, t: any }) {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Dynamically extract categories from weapon instances
  const categories = ["ALL", ...Array.from(new Set(weapons.map(w => w.category || 'Custom').filter(Boolean)))];

  const filtered = weapons.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(search.toLowerCase()) || 
                          w.description?.toLowerCase().includes(search.toLowerCase()) ||
                          w.id.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === "ALL" || (w.category || 'Custom') === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <SectionHeading title={t('weapon_db')} subtitle={t('weapon_storage')} />
        
        {/* Dynamic Search Interface */}
        <div className="relative max-w-sm w-full">
          <input 
            type="text" 
            placeholder="Search within Weapon Archives..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-theme-surface border border-theme-border rounded px-4 py-2.5 text-xs focus:outline-none focus:border-theme-accent font-mono text-white placeholder:opacity-30 pl-10"
          />
          <Search className="w-3.5 h-3.5 text-theme-muted absolute left-3.5 top-3.5" />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-3.5 text-theme-muted hover:text-white font-mono text-[9px] uppercase font-bold">Clear</button>
          )}
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-theme-border/60">
        {categories.map(cat => {
          const count = weapons.filter(w => cat === "ALL" || (w.category || "Custom") === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-full font-mono text-[8.5px] uppercase tracking-wider font-extrabold border transition-all ${
                selectedCategory === cat 
                  ? 'bg-theme-accent text-theme-bg border-theme-accent shadow-md shadow-theme-accent/15' 
                  : 'bg-theme-surface hover:bg-theme-accent/5 border-theme-border text-theme-muted hover:text-white'
              }`}
            >
              {cat} <span className="opacity-65 ml-1">({count})</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-theme-surface border border-theme-border border-dashed rounded-2xl flex flex-col items-center justify-center">
          <Sword className="w-10 h-10 text-theme-muted opacity-25 mb-3" />
          <p className="text-[10px] text-theme-muted uppercase tracking-widest font-mono font-bold">No weapons matched choice filter parameters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {filtered.map(w => <WeaponCard key={w.id} weapon={w} onClick={() => onSelect(w)} t={t} />)}
        </div>
      )}
    </div>
  );
}

function SubActionCard({
  actionId,
  subAction,
  handObjects,
  frameCount,
  frameDelay,
  globalFrame,
  syncTimeline,
  globalPlaying,
  t,
  localFrames = [],
  subActionIndex = 0
}: {
  actionId: string;
  subAction: string;
  handObjects: string[];
  frameCount: number;
  frameDelay: number;
  globalFrame: number;
  syncTimeline: boolean;
  globalPlaying: boolean;
  t: any;
  key?: any;
  localFrames?: string[];
  subActionIndex?: number;
}) {
  const [localFrame, setLocalFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedHand, setSelectedHand] = useState(handObjects[0] || 'Empty');
  const [zoom, setZoom] = useState(1.1);
  const [rotate, setRotate] = useState(0);

  const safeFrameCount = localFrames && localFrames.length > 0 ? localFrames.length : 1;

  // Independent animation timeline if not globally synchronized
  useEffect(() => {
    if (syncTimeline || !isPlaying) return;
    const intervalTime = frameDelay > 0 ? frameDelay : 120;
    const timer = setInterval(() => {
      setLocalFrame(f => (f + 1) % safeFrameCount);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [syncTimeline, isPlaying, safeFrameCount, frameDelay]);

  const baseFrame = syncTimeline ? globalFrame : localFrame;
  const currentFrameIndex = (baseFrame + subActionIndex) % safeFrameCount;
  const isCurrentlyPlaying = syncTimeline ? globalPlaying : isPlaying;

  // Real-time anime sequential path generation conforming to spec
  const sanitizedSub = subAction.replace(/\s+/g, '').replace(/°/g, 'deg');
  const sanitizedHand = selectedHand.replace(/\s+/g, '').replace(/[/]/g, '');
  const frameStr = String(currentFrameIndex + 1).padStart(2, '0');
  const resolvedFilename = `${actionId}_${sanitizedSub}_${sanitizedHand}_${frameStr}.png`;

  // Custom User Image or NO IMAGE instead of Picsum fallback
  const hasFrames = localFrames && localFrames.length > 0;
  const imgUrl = hasFrames ? localFrames[currentFrameIndex % localFrames.length] : "";

  const handleDownload = async () => {
    if (!imgUrl) return;
    try {
      const response = await fetch(imgUrl, { referrerPolicy: 'no-referrer' });
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = resolvedFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      // Direct high-fidelity canvas crossOrigin rebuild fallback
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.referrerPolicy = 'no-referrer';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, 320, 400);
          try {
            const dataUrl = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.href = dataUrl;
            downloadLink.download = resolvedFilename;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
          } catch (err) {
            window.open(imgUrl, '_blank');
          }
        }
      };
      img.src = imgUrl;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-theme-bg/70 border border-theme-border rounded-2xl p-5 flex flex-col gap-4 text-left shadow-md hover:border-theme-accent/50 transition-all duration-300 relative group"
    >
      {/* Node Title & Specs */}
      <div className="flex justify-between items-start border-b border-theme-border/60 pb-3">
        <div>
          <h5 className="text-[10px] uppercase font-black tracking-widest text-[#FF5A79] font-mono flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 bg-[#FF5A79] rounded-full animate-ping" />
            {subAction}
          </h5>
          <p className="text-[8px] text-theme-muted font-mono tracking-tight select-all truncate mt-0.5 max-w-[170px]" title={resolvedFilename}>
            {resolvedFilename}
          </p>
        </div>
        <span className="text-[8px] bg-theme-accent/10 px-2 py-0.5 rounded text-theme-accent font-bold uppercase tracking-wider font-mono">
          RESOLVED
        </span>
      </div>

      {/* Equipment Input Selection */}
      <div>
        <label className="block text-[8px] text-theme-muted font-black uppercase tracking-wider mb-1 font-mono">
          Hand Object (Equipment Input)
        </label>
        <select
          value={selectedHand}
          onChange={(e) => setSelectedHand(e.target.value)}
          className="w-full bg-[#161618] text-theme-text text-[10px] font-mono border border-theme-border/80 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-theme-accent select-none"
        >
          {handObjects.map(hand => (
            <option key={hand} value={hand}>{hand}</option>
          ))}
        </select>
      </div>

      {/* Dynamic Screen Viewport with transform scale & rotate */}
      <div className="relative h-56 bg-black/50 rounded-xl border border-theme-border/80 overflow-hidden flex items-center justify-center group-hover:border-theme-accent/30 transition-colors">
        <div 
          className="transition-transform duration-100 ease-out flex items-center justify-center p-4 cursor-grab active:cursor-grabbing"
          style={{
            transform: `scale(${zoom}) rotate(${rotate}deg)`
          }}
        >
          {imgUrl ? (
            <img 
              src={imgUrl} 
              alt={subAction}
              className="h-44 object-contain rounded-md saturate-50 hover:saturate-100 transition-all shadow-lg pointer-events-none" 
            />
          ) : (
            <div className="flex flex-col items-center justify-center text-center p-3 text-theme-muted">
              <Sword className="w-12 h-12 opacity-35 text-[#FF5A79] animate-pulse mb-2" />
              <p className="text-[9px] font-mono uppercase font-black tracking-widest text-[#FF5A79] opacity-90">No Model Registered</p>
              <p className="text-[7.5px] uppercase font-semibold font-mono tracking-wider text-theme-muted mt-1 leading-relaxed max-w-[160px]">
                Enter direct image URL inside detail workspace
              </p>
            </div>
          )}
        </div>

        {/* Floating details badge corner */}
        <div className="absolute top-2.5 right-2.5 flex flex-col gap-1 items-end pointer-events-none select-none z-10">
          {zoom !== 1 && (
            <span className="bg-black/80 backdrop-blur text-[8px] font-mono font-bold text-theme-accent px-1.5 py-0.5 rounded border border-theme-border/50">
              ZOOM: {Math.round(zoom * 100)}%
            </span>
          )}
          {rotate !== 0 && (
            <span className="bg-black/80 backdrop-blur text-[8px] font-mono font-bold text-[#E6BF5C] px-1.5 py-0.5 rounded border border-theme-border/50">
              ROT: {rotate}°
            </span>
          )}
        </div>

        {/* Sub-action frame playback indicator */}
        <div className="absolute bottom-2.5 left-2.5 text-[8px] font-mono text-theme-text bg-black/70 backdrop-blur px-2.5 py-1 rounded border border-theme-border/60 select-none z-10 flex items-center gap-1.5">
          <span className={`w-1 h-1 bg-green-500 rounded-full ${isCurrentlyPlaying ? 'animate-pulse' : 'opacity-45'}`} />
          <span>F-INDEX: {currentFrameIndex + 1}/{frameCount}</span>
        </div>

        {/* Local timeline Play/Pause */}
        {!syncTimeline && (
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="absolute bottom-2.5 right-2.5 p-1 bg-black/70 backdrop-blur border border-theme-border hover:border-theme-accent text-white rounded transition-colors z-10"
          >
            {isPlaying ? <Unlock className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5" />}
          </button>
        )}
      </div>

      {/* Manual Inputs & Sliders for Zoom & Rotation */}
      <div className="space-y-3 mt-auto">
        {/* Zoom adjustment range slider */}
        <div className="space-y-1 text-[8px] font-mono">
          <div className="flex justify-between text-theme-muted font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1"><ZoomIn className="w-3 h-3" /> Scale Ratio</span>
            <span className="text-theme-accent font-black">{(zoom * 100).toFixed(0)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="range"
              min="0.5"
              max="2.5"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-theme-accent h-1 rounded bg-[#252528] appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Rotation degree dial slider */}
        <div className="space-y-1 text-[8px] font-mono">
          <div className="flex justify-between text-theme-muted font-bold uppercase tracking-wider">
            <span className="flex items-center gap-1"><RotateCw className="w-3 h-3" /> Angular Rotation</span>
            <span className="text-[#E6BF5C] font-black">{rotate}°</span>
          </div>
          <div className="flex items-center gap-2">
            <input 
              type="range"
              min="-180"
              max="180"
              step="5"
              value={rotate}
              onChange={(e) => setRotate(parseInt(e.target.value))}
              className="w-full accent-[#E6BF5C] h-1 rounded bg-[#252528] appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Action Triggers Footer */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-theme-border/40 text-[9px] font-bold mt-1">
          <button 
            type="button"
            onClick={handleDownload}
            className="flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-theme-accent/15 hover:bg-theme-accent hover:text-white border border-theme-accent/25 text-theme-accent text-[9px] uppercase tracking-wider transition-all font-mono"
            title="Download this frame sequence asset"
          >
            <Download className="w-3 h-3 text-current" /> Save PNG
          </button>
          <button 
            type="button"
            onClick={() => { setZoom(1.1); setRotate(0); }}
            className="py-1.5 rounded-lg bg-[#252528] hover:bg-[#323236] text-theme-muted hover:text-theme-text text-[9px] uppercase tracking-wider transition-all font-mono"
          >
            Reset
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function ActionPlayer({ action, isAdmin, onEdit, onClose, onRefresh, t }: { action: Action, isAdmin: boolean, onEdit: () => void, onClose: () => void, onRefresh?: () => void, t: any }) {
  const [localFrames, setLocalFrames] = useState<string[]>(() => {
    try {
      return JSON.parse(action.frames_json) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      setLocalFrames(JSON.parse(action.frames_json) || []);
    } catch {
      setLocalFrames([]);
    }
  }, [action.id, action.frames_json]);

  const finalFrameCount = localFrames && localFrames.length > 0 ? localFrames.length : action.frame_count;

  const [manualUrl, setManualUrl] = useState("");
  const [isSubmittingUrl, setIsSubmittingUrl] = useState(false);

  const handleManualUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl.trim()) return;
    setIsSubmittingUrl(true);
    setUploadError(null);
    try {
      let updatedImages = [];
      if (uploadMode === 'replace') {
        updatedImages = [manualUrl.trim()];
      } else {
        updatedImages = [...localFrames, manualUrl.trim()];
      }
      const res = await fetch(`/api/actions/${action.id}/images`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: updatedImages }),
      });
      const data = await res.json();
      if (data.success) {
        setLocalFrames(updatedImages);
        setManualUrl("");
        if (onRefresh) {
          onRefresh();
        }
      } else {
        setUploadError(data.error || "Failed to register reference frames");
      }
    } catch (err: any) {
      setUploadError(err.message || "Manual registration failed");
    } finally {
      setIsSubmittingUrl(false);
    }
  };
  
  const subActionsList = action.sub_action ? action.sub_action.split(',').map(s => s.trim()) : ['Neutral'];
  const handObjectsList = action.hand_object ? action.hand_object.split(',').map(h => h.trim()) : ['Empty'];

  // Modal View States
  const [viewMode, setViewMode] = useState<'grid' | 'single' | 'upload'>('grid'); // Default to full child grid analyzer
  const [syncTimeline, setSyncTimeline] = useState(true);
  const [globalPlaying, setGlobalPlaying] = useState(false);
  const [globalFrame, setGlobalFrame] = useState(0);
  const [uploadMode, setUploadMode] = useState<'replace' | 'append'>('replace');

  // Upload Reference File Handling States
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (files.length > 5) {
      setUploadError("Upload limit exceeded: You can load a maximum of 5 images at once.");
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i]);
      }
      const res = await fetch(`/api/actions/${action.id}/upload?mode=${uploadMode}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setLocalFrames(data.frames);
        if (onRefresh) {
          onRefresh(); // Trigger parent database load so that Gallery counts refresh
        }
      } else {
        setUploadError(data.message || "Failed to upload reference images");
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Something went wrong during upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  // Global resets counters
  const [resetCounter, setResetCounter] = useState(0);

  // Master frame tick matching delay timing
  useEffect(() => {
    if (!globalPlaying) return;
    const intervalTime = action.frame_delay > 0 ? action.frame_delay : 120;
    const timer = setInterval(() => {
      setGlobalFrame(f => (f + 1) % finalFrameCount);
    }, intervalTime);
    return () => clearInterval(timer);
  }, [globalPlaying, finalFrameCount, action.frame_delay]);

  // Master focus states
  const [singleZoom, setSingleZoom] = useState(1.2);
  const [singleRotate, setSingleRotate] = useState(0);
  const [singleHand, setSingleHand] = useState(handObjectsList[0] || 'Empty');
  const [selectedSubAction, setSelectedSubAction] = useState(subActionsList[0] || 'Neutral');

  const handleGlobalReset = () => {
    setResetCounter(prev => prev + 1);
    setSingleZoom(1.2);
    setSingleRotate(0);
    setSingleHand(handObjectsList[0] || 'Empty');
  };

  const handleDownloadFocusedFrame = async () => {
    const sanitizedSub = selectedSubAction.replace(/\s+/g, '').replace(/°/g, 'deg');
    const sanitizedHand = singleHand.replace(/\s+/g, '').replace(/[/]/g, '');
    const filename = `${action.id}_${sanitizedSub}_${sanitizedHand}_${String(globalFrame + 1).padStart(2, '0')}.png`;
    const targetUrl = `https://picsum.photos/seed/lh_${action.id}_${sanitizedSub}_${sanitizedHand}_${globalFrame}/380/500?grayscale`;
    
    try {
      const response = await fetch(targetUrl, { referrerPolicy: 'no-referrer' });
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(objectUrl);
    } catch (e) {
      window.open(targetUrl, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-5">
      {/* Immersive backdrop */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-theme-bg/95 backdrop-blur-md"
      />

      <motion.div
        initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }}
        className="relative bg-theme-surface border border-theme-border rounded-3xl w-full max-w-[95vw] h-[92vh] flex flex-col overflow-hidden shadow-[0_0_80px_rgba(255,183,197,0.15)] z-10"
      >
        {/* Dynamic Studio Top Workspace Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-theme-border p-5 bg-[#0f0f10]">
          <div className="flex items-center gap-4 text-left">
            <span className="w-8 h-8 rounded-full bg-[#FF5A79]/10 flex items-center justify-center font-mono font-black text-xs text-[#FF5A79] border border-[#FF5A79]/20">
              {action.id}
            </span>
            <div>
              <p className="text-[10px] text-[#FF5A79] uppercase tracking-[0.34em] font-mono font-black flex items-center gap-1.5">
                <span>MOTION MATRIX RESOLUTION</span>
                <span className="text-theme-muted">/</span>
                <span className="text-[#FF5A79] font-serif italic text-[11px] font-medium lowercase">({subActionsList.length} sub-states)</span>
              </p>
              <h3 className="text-theme-text text-xl font-black uppercase tracking-tighter italic">
                {action.verb_name}
              </h3>
            </div>
          </div>

          {/* Mode Tabs */}
          <div className="flex flex-wrap items-center gap-2 p-1 bg-theme-[#18181a] border border-[#28282b] rounded-xl self-start md:self-auto">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-4 py-2 rounded-lg text-[9px] uppercase font-black tracking-widest transition-all flex items-center gap-2 ${viewMode === 'grid' ? 'bg-[#FF5A79]/20 text-[#FF5A79] border border-[#FF5A79]/30' : 'text-theme-muted hover:text-white'}`}
            >
              <Layers className="w-3.5 h-3.5" /> Grid Resolve ({subActionsList.length})
            </button>
            <button
              onClick={() => setViewMode('single')}
              className={`px-4 py-2 rounded-lg text-[9px] uppercase font-black tracking-widest transition-all flex items-center gap-2 ${viewMode === 'single' ? 'bg-[#FF5A79]/20 text-[#FF5A79] border border-[#FF5A79]/30' : 'text-theme-muted hover:text-white'}`}
            >
              <Maximize2 className="w-3.5 h-3.5" /> Single Focus Viewer
            </button>
            <button
              onClick={() => setViewMode('upload')}
              className={`px-4 py-2 rounded-lg text-[9px] uppercase font-black tracking-widest transition-all flex items-center gap-2 ${viewMode === 'upload' ? 'bg-[#FF5A79]/20 text-[#FF5A79] border border-[#FF5A79]/30' : 'text-[#E6BF5C] hover:text-white'}`}
            >
              <Upload className="w-3.5 h-3.5 animate-bounce-slow" /> Upload Pose Reference ({localFrames.length})
            </button>
          </div>

          {/* Action Exit Buttons */}
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button 
                onClick={onEdit} 
                className="hidden sm:flex items-center gap-2 px-4 py-2 border border-[#FF5A79]/40 hover:bg-[#FF5A79] hover:text-white text-[#FF5A79] transition-all text-[9.5px] font-mono uppercase font-black tracking-widest rounded-xl"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Database
              </button>
            )}
            <button 
              onClick={onClose}
              className="p-2 border border-theme-border hover:border-[#FF5A79] hover:text-[#FF5A79] text-theme-muted rounded-xl transition-all"
              title="Close Workspace Viewer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Keyframe Timeline Dashboard Controller */}
        <div className="bg-[#121214] border-b border-theme-border/60 p-5 flex flex-wrap gap-6 items-center justify-between text-left select-none">
          {/* Main timeline controls */}
          <div className="flex flex-wrap items-center gap-5">
            {/* Timeline play state input */}
            <button
              onClick={() => setGlobalPlaying(!globalPlaying)}
              className="p-3 bg-[#FF5A79] hover:bg-[#FF456a] rounded-full text-white shadow-lg transition-all"
              title={globalPlaying ? "Pause Master Timeline" : "Resume Master Timeline"}
            >
              {globalPlaying ? <Unlock className="w-4 h-4 fill-white animate-pulse" /> : <Play className="w-4 h-4 fill-white" />}
            </button>

            {/* Global scrubber input */}
            <div className="space-y-1 pb-0.5">
              <div className="flex justify-between items-center text-[8px] font-mono text-theme-muted uppercase font-bold tracking-wider">
                <span>Timeline Scrubber Scenarios</span>
                <span>Frame {globalFrame + 1} / {finalFrameCount}</span>
              </div>
              <div className="flex items-center gap-3 bg-[#1e1e21] border border-theme-border/85 p-2 rounded-xl w-60 sm:w-80">
                <input
                  type="range"
                  min="0"
                  max={finalFrameCount - 1}
                  value={globalFrame}
                  onChange={(e) => {
                    setGlobalPlaying(false);
                    setGlobalFrame(parseInt(e.target.value));
                  }}
                  className="w-full accent-[#FF5A79] h-1.5 rounded appearance-none cursor-pointer"
                />
                <span className="text-[10px] font-mono text-[#FF5A79] font-black w-7 text-right">
                  #{String(globalFrame + 1).padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* Playback lockstep sync input */}
            <div className="flex items-center gap-3 bg-[#1c1c1e] px-4 py-2 rounded-xl border border-theme-border/80">
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={syncTimeline}
                  onChange={(e) => setSyncTimeline(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-theme-bg peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-300 after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:after:bg-[#FF5A79] peer-checked:bg-[#FF5A79]/20" />
              </label>
              <span className="text-[9px] uppercase font-mono font-black text-theme-muted tracking-wider">Timeline Synchronization</span>
            </div>
          </div>

          {/* Reset controllers action button */}
          <button
            onClick={handleGlobalReset}
            className="px-4 py-2.5 border border-theme-border hover:border-theme-accent/60 text-[#D4AC4B] hover:text-white rounded-xl text-[9px] uppercase font-mono tracking-widest font-black transition-all bg-theme-bg"
          >
            Reset All Cards to Default
          </button>
        </div>

        {/* Dynamic Studio Layout Section */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
          <div className="flex-1 overflow-y-auto bg-theme-bg/50">
            {viewMode === 'grid' ? (
              /* High organization Children Grid Resolver (Showing all 8 children) */
              <div className="p-6 space-y-6">
                <div className="flex items-center justify-between border-b border-theme-border/40 pb-2">
                  <h4 className="text-[10px] font-mono uppercase font-black tracking-[0.3em] text-theme-muted">
                    Sub-action Resolved Child Array ({subActionsList.length} inputs active)
                  </h4>
                  <span className="text-[8px] font-sans italic text-theme-muted opacity-60">
                    Each card below represents a separate camera direction/variant index
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {subActionsList.map((subAction, index) => (
                    <SubActionCard
                      key={`${subAction}_${resetCounter}`}
                      actionId={action.id}
                      subAction={subAction}
                      handObjects={handObjectsList}
                      frameCount={finalFrameCount}
                      frameDelay={action.frame_delay > 0 ? action.frame_delay : 120}
                      globalFrame={globalFrame}
                      syncTimeline={syncTimeline}
                      globalPlaying={globalPlaying}
                      t={t}
                      localFrames={localFrames}
                      subActionIndex={index}
                    />
                  ))}
                </div>
              </div>
            ) : viewMode === 'single' ? (
              /* Master focussed projection player view mode */
              <div className="p-12 flex items-center justify-center min-h-[500px]">
                <div className="flex flex-col lg:flex-row gap-12 items-center max-w-5xl w-full bg-[#18181a] p-10 rounded-3xl border border-theme-border">
                  {/* Big Image display screen */}
                  <div className="flex-1 flex flex-col items-center gap-6 relative">
                    <div className="relative rounded-2xl overflow-hidden p-6 bg-black/60 border border-theme-border max-w-md w-full flex items-center justify-center min-h-[350px]">
                      {localFrames && localFrames.length > 0 ? (
                        <div 
                          className="transition-transform duration-100 ease-out"
                          style={{
                            transform: `scale(${singleZoom}) rotate(${singleRotate}deg)`
                          }}
                        >
                          <img 
                            src={localFrames[globalFrame % localFrames.length]} 
                            alt={action.verb_name} 
                            className="max-h-[48vh] object-contain rounded-lg saturate-50 hover:saturate-100 transition-all duration-300" 
                          />
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-center p-6 text-theme-muted">
                          <Sword className="w-16 h-16 opacity-30 text-[#FF5A79] animate-pulse mb-3" />
                          <p className="text-sm font-mono uppercase font-black text-[#FF5A79] tracking-wider mb-2">No Active Projection</p>
                          <p className="text-xs text-[#8d94a0] uppercase font-mono tracking-widest max-w-xs leading-relaxed font-semibold">
                            Enter a direct image reference URL or upload pictures inside the registry panel
                          </p>
                        </div>
                      )}
                      <div className="absolute top-4 left-4 px-2.5 py-1 bg-[#FF5A79] text-white text-[8px] font-mono font-bold uppercase rounded tracking-wider">
                        MASTER PROJECTION STAGE
                      </div>
                    </div>
                    
                    <p className="text-[10px] font-mono text-theme-muted tracking-widest font-black uppercase bg-theme-bg px-4 py-1.5 rounded-full border border-theme-border">
                      Current: <span className="text-[#FF5A79]">{action.id}_{selectedSubAction}_{singleHand}_{globalFrame + 1}.png</span>
                    </p>
                  </div>

                  {/* Focused view config inputs */}
                  <div className="w-full lg:w-80 text-left space-y-6">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF5A79] border-b border-theme-border pb-3">
                      Focus Setup & Modifiers
                    </h4>

                    {/* Choose active child sub_action direction input */}
                    <div>
                      <label className="block text-[8px] text-theme-muted font-black uppercase tracking-wider mb-2 font-mono">
                        Select Sub-action direction to focus
                      </label>
                      <select
                        value={selectedSubAction}
                        onChange={(e) => setSelectedSubAction(e.target.value)}
                        className="w-full bg-[#161618] text-theme-text text-[11px] font-mono border border-theme-border rounded-xl px-3 py-2.5 focus:outline-none focus:border-theme-accent"
                      >
                        {subActionsList.map(item => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </div>

                    {/* Choose active equipment hand input */}
                    <div>
                      <label className="block text-[8px] text-theme-muted font-black uppercase tracking-wider mb-2 font-mono">
                        Select Hand Object equip
                      </label>
                      <select
                        value={singleHand}
                        onChange={(e) => setSingleHand(e.target.value)}
                        className="w-full bg-[#161618] text-theme-text text-[11px] font-mono border border-theme-border rounded-xl px-3 py-2.5 focus:outline-none focus:border-theme-accent"
                      >
                        {handObjectsList.map(item => (
                          <option key={item} value={item}>{item}</option>
                        ))}
                      </select>
                    </div>

                    {/* Zoom & Rotation modifiers inputs */}
                    <div className="space-y-4 pt-3 border-t border-theme-border">
                      {/* Zoom Input */}
                      <div className="space-y-1.5 font-mono text-[9px]">
                        <div className="flex justify-between text-theme-muted font-bold">
                          <span>STAGE ZOOM FOCUS</span>
                          <span className="text-[#FF5A79] font-black">{(singleZoom * 100).toFixed(0)}%</span>
                        </div>
                        <input 
                          type="range"
                          min="0.5"
                          max="2.5"
                          step="0.05"
                          value={singleZoom}
                          onChange={(e) => setSingleZoom(parseFloat(e.target.value))}
                          className="w-full accent-[#FF5A79] h-1 bg-[#1e1e21] rounded"
                        />
                      </div>

                      {/* Rotation Input */}
                      <div className="space-y-1.5 font-mono text-[9px]">
                        <div className="flex justify-between text-theme-muted font-bold">
                          <span>STAGE rotation focus</span>
                          <span className="text-[#E6BF5C] font-black">{singleRotate}°</span>
                        </div>
                        <input 
                          type="range"
                          min="-180"
                          max="180"
                          step="5"
                          value={singleRotate}
                          onChange={(e) => setSingleRotate(parseInt(e.target.value))}
                          className="w-full accent-[#E6BF5C] h-1 bg-[#1e1e21] rounded"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[#2d2d30] flex flex-col gap-3">
                      <button
                        onClick={handleDownloadFocusedFrame}
                        className="w-full py-3 bg-[#FF5A79] hover:bg-[#FF456a] text-white rounded-xl text-[10px] uppercase font-black tracking-widest transition-all flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" /> Download Keyframe PNG
                      </button>
                      <button
                        onClick={() => { setSingleZoom(1.2); setSingleRotate(0); }}
                        className="w-full py-2.5 bg-theme-bg hover:bg-theme-bg/85 border border-theme-border text-theme-muted text-[9px] uppercase tracking-widest font-bold transition-all rounded-xl"
                      >
                        Reset Projection Controls
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Immersive Reference Poses Uploader Workspace */
              <div className="p-8 sm:p-12 max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500 text-left">
                <div className="bg-[#121214] border border-theme-border rounded-[2.5rem] p-8 sm:p-12 relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-[#FF5A79]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                  
                  <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-theme-border/40">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-[#FF5A79]/10 rounded-2xl border border-[#FF5A79]/20 shadow-inner">
                        <Upload className="w-6 h-6 text-[#FF5A79]" />
                      </div>
                      <div>
                        <h3 className="text-xl font-black uppercase text-theme-text tracking-tight italic flex items-center gap-2">
                          {action.verb_name} <span className="text-xs uppercase font-black text-theme-muted not-italic font-mono">/ pose references</span>
                        </h3>
                        <p className="text-xs text-[#8d94a0] mt-1 font-mono uppercase tracking-wider">
                          Upload Custom Sprite-Sheets or Individual Target Poses
                        </p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-[#FF5A79] hover:bg-[#FF456a] text-white rounded-xl text-[10px] uppercase font-black tracking-widest transition-all shadow-lg shadow-[#FF5A79]/20 self-start md:self-auto"
                    >
                      Browse Reference Files
                    </button>
                  </div>

                  {/* Upload Mode Selector Option */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-theme-bg/60 border border-theme-border rounded-2xl mb-6 gap-3">
                    <div>
                      <p className="text-[9px] font-black uppercase text-theme-text font-mono tracking-wider">Upload Strategy Profile</p>
                      <p className="text-[8.5px] text-theme-muted font-bold uppercase tracking-wide mt-0.5">Determine if the newly uploaded files should replace existing records or append to them.</p>
                    </div>
                    <div className="flex items-center gap-1.5 p-1 bg-[#161618] border border-theme-border rounded-xl self-start sm:self-auto">
                      <button
                        onClick={(e) => { e.stopPropagation(); setUploadMode('replace'); }}
                        className={`px-3 py-1.5 rounded-lg text-[8.5px] uppercase font-black font-mono tracking-widest transition-all ${uploadMode === 'replace' ? 'bg-[#FF5A79] text-white shadow font-extrabold' : 'text-theme-muted hover:text-theme-text'}`}
                      >
                        REPLACE ALL IMAGES
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setUploadMode('append'); }}
                        className={`px-3 py-1.5 rounded-lg text-[8.5px] uppercase font-black font-mono tracking-widest transition-all ${uploadMode === 'append' ? 'bg-theme-surface border border-theme-border text-theme-accent shadow font-extrabold' : 'text-theme-muted hover:text-theme-text'}`}
                      >
                        APPEND / KEEP EXISTING
                      </button>
                    </div>
                  </div>

                  {/* Drag and Drop Zone */}
                  <div 
                    onDragEnter={handleDrag}
                    onDragOver={handleDrag}
                    onDragLeave={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-[2rem] p-12 flex flex-col items-center justify-center gap-6 cursor-pointer transition-all duration-300 relative overflow-hidden ${dragActive ? 'border-[#FF5A79] bg-[#FF5A79]/10 shadow-inner' : 'border-[#303033] bg-[#171719]/50 hover:border-[#FF5A79]/50 hover:bg-[#18181a]'}`}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      multiple 
                      accept="image/*"
                      onChange={(e) => handleFilesUpload(e.target.files)} 
                    />
                    
                    {isUploading ? (
                      <div className="flex flex-col items-center gap-4 py-8">
                        <Loader2 className="w-12 h-12 text-[#FF5A79] animate-spin" />
                        <p className="text-[11px] font-mono text-theme-muted uppercase tracking-widest font-black">Uploading & Registering reference poses...</p>
                      </div>
                    ) : (
                      <>
                        <div className="p-5 bg-theme-surface rounded-2xl border border-theme-border/80 shadow-md transform group-hover:scale-105 transition-transform">
                          <Upload className="w-8 h-8 text-[#FF5A79]" />
                        </div>
                        <div className="text-center space-y-2 max-w-md">
                          <p className="text-sm text-theme-text font-black uppercase tracking-wider leading-snug">Drag and drop up to 5 images here, or <span className="text-[#FF5A79] underline hover:text-[#FF456a] transition-colors">browse physical drive</span></p>
                          <p className="text-[10px] text-theme-muted leading-relaxed">
                            These source references will be kept inside this database specifically for the <strong>{action.verb_name || "IDLE"}</strong> pose to align and retarget custom character coordinates properly.
                          </p>
                        </div>
                        <div className="px-4 py-1 bg-theme-surface rounded-full border border-theme-border/60 text-[8px] text-theme-muted font-mono tracking-widest uppercase">
                          PNG, JPG, SVG • Max 5 images at once • Up to 25MB each
                        </div>
                      </>
                    )}
                  </div>

                  {/* Manual URL Registration Section */}
                  <form onSubmit={handleManualUrlSubmit} className="mt-6 p-5 bg-[#141415] border border-theme-border rounded-xl text-left space-y-4">
                    <div>
                      <p className="text-[10px] font-black uppercase text-theme-text font-mono tracking-wider">Manual Reference Image Link Input</p>
                      <p className="text-[8.5px] text-theme-muted font-bold uppercase tracking-wide mt-0.5">
                        Don't have local files? Paste any direct image URL (HTTP/HTTPS or base64 dataURI) below.
                      </p>
                    </div>
                    <div className="flex gap-2.5">
                      <input
                        type="text"
                        value={manualUrl}
                        onChange={(e) => setManualUrl(e.target.value)}
                        placeholder="e.g. https://images.unsplash.com/photo-..."
                        className="flex-1 bg-theme-bg text-theme-text font-mono placeholder:text-theme-muted text-xs border border-theme-border/80 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#FF5A79]"
                      />
                      <button
                        type="submit"
                        disabled={isSubmittingUrl || !manualUrl.trim()}
                        className="px-5 bg-[#FF5A79] hover:bg-[#FF456a] disabled:bg-[#252528] disabled:text-theme-muted text-white text-xs rounded-xl font-bold transition-all whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        {isSubmittingUrl ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                        Add Link
                      </button>
                    </div>
                  </form>

                  {uploadError && (
                    <div className="mt-5 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 font-mono">
                      FAIL: {uploadError}
                    </div>
                  )}
                </div>

                {/* Grid list of uploaded frames */}
                <div className="space-y-6">
                  <div className="flex justify-between items-center border-b border-theme-border pb-3">
                    <h4 className="text-[11px] font-mono uppercase font-black tracking-[0.25em] text-theme-muted">
                      Active Action Reference Frames ({localFrames.length})
                    </h4>
                    <span className="text-[9px] uppercase font-bold text-theme-muted bg-[#202022] px-3 py-1 rounded">
                      Database Source Segment
                    </span>
                  </div>

                  {localFrames.length === 0 ? (
                    <div className="p-20 text-center bg-[#151517]/40 border border-theme-border rounded-[2rem] flex flex-col items-center gap-4">
                      <ImageIcon className="w-12 h-12 text-theme-muted opacity-40 animate-pulse" />
                      <p className="text-xs uppercase font-black tracking-widest font-mono text-theme-muted mt-2">No references uploaded yet</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-6">
                      {localFrames.map((framePath, i) => (
                        <div key={i} className="group bg-[#18181a] border border-theme-border hover:border-[#FF5A79]/50 rounded-2xl overflow-hidden relative shadow-lg transition-all duration-300">
                          <div className="aspect-square bg-black flex items-center justify-center overflow-hidden">
                            <img src={framePath} className="w-full h-full object-cover saturate-50 group-hover:saturate-100 transition-all duration-300" />
                          </div>
                          
                          <div className="p-3 border-t border-theme-border bg-[#151517] text-center">
                            <p className="text-[10px] font-mono text-theme-text uppercase font-black">
                              frame_#{String(i + 1).padStart(2, '0')}
                            </p>
                          </div>

                          <button 
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const remaining = localFrames.filter((_, idx) => idx !== i);
                                const res = await fetch(`/api/actions/${action.id}`, {
                                  method: "PUT",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    ...action,
                                    existing_frames: JSON.stringify(remaining)
                                  })
                                });
                                const data = await res.json();
                                if (data.success) {
                                  setLocalFrames(remaining);
                                  onRefresh?.();
                                }
                              } catch (e) {
                                console.error(e);
                              }
                            }}
                            className="absolute top-3 right-3 p-2 bg-red-600 hover:bg-red-500 rounded-lg text-white opacity-0 group-hover:opacity-100 transition-all duration-200 shadow-md"
                            title="Remove frame"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Metadata Sidebar Inspector (Right panel) */}
          <div className="hidden xl:flex w-80 border-l border-theme-border p-8 flex-col bg-theme-surface overflow-y-auto text-left select-text shadow-inner">
            <h4 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#FF5A79] mb-6 border-b border-theme-border pb-3">
              Master Metadata Sheet
            </h4>

            {/* Properties List */}
            <div className="space-y-5 text-left text-[11px] flex-1">
              <div>
                <p className="text-[8px] text-theme-muted uppercase tracking-wider font-mono font-bold mb-1">Main Category Node</p>
                <p className="text-theme-text uppercase font-black tracking-tight leading-tight select-all">
                  {action.category}
                </p>
              </div>

              <div>
                <p className="text-[8px] text-theme-muted uppercase tracking-wider font-mono font-bold mb-1">Row Keyframe Scheme</p>
                <p className="text-[#FF5A79] font-mono font-bold text-[9px] bg-theme-bg p-2.5 rounded-xl border border-theme-border max-h-52 overflow-y-auto w-full break-all">
                  {action.frames_json}
                </p>
              </div>

              <div>
                <p className="text-[8px] text-theme-muted uppercase tracking-wider font-mono font-bold mb-1">Database Timeline Values</p>
                <div className="grid grid-cols-2 gap-3 font-mono text-[10px] mt-1 bg-[#151517] p-2.5 rounded-lg border border-theme-border">
                  <div>
                    <span className="block text-theme-muted text-[8px] uppercase">Frame Count</span>
                    <span className="font-bold text-theme-text">{action.frame_count}</span>
                  </div>
                  <div>
                    <span className="block text-theme-muted text-[8px] uppercase">Delay Time</span>
                    <span className="font-bold text-theme-text">{action.frame_delay} ms</span>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-[8px] text-theme-muted uppercase tracking-wider font-mono font-bold mb-1">Director translation notes</p>
                <p className="text-theme-text font-serif italic text-xs bg-theme-bg p-3.5 rounded-xl border border-theme-border leading-relaxed">
                  {action.notes || "No extra notation."}
                </p>
              </div>
            </div>

            {/* Save System Package */}
            <div className="pt-4 border-t border-theme-border space-y-3">
              <button 
                onClick={handleDownloadFocusedFrame}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#E6BF5C] border border-[#C69F3E] text-slate-900 rounded-xl font-bold font-mono text-[9px] uppercase tracking-widest hover:bg-[#D4AC4B] transition-all"
              >
                <Download className="w-3.5 h-3.5" /> Export Active State
              </button>
              <button 
                onClick={onClose} 
                className="w-full py-3 bg-[#202022] hover:bg-[#2b2b2f] text-[9px] text-theme-muted font-black uppercase tracking-widest rounded-xl transition-all"
              >
                Dismiss Viewer
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

// --- Weapon Player Modal Component (CRUD for Weapon Reference Images) ---
function WeaponPlayer({ weapon, isAdmin, onClose, onRefresh, t }: { weapon: Weapon, isAdmin: boolean, onClose: () => void, onRefresh?: () => void, t: any }) {
  const [localImages, setLocalImages] = useState<string[]>(() => {
    try {
      return JSON.parse(weapon.images_json || "[]") || [];
    } catch {
      return weapon.image_path ? [weapon.image_path] : [];
    }
  });

  useEffect(() => {
    try {
      setLocalImages(JSON.parse(weapon.images_json || "[]") || []);
    } catch {
      setLocalImages(weapon.image_path ? [weapon.image_path] : []);
    }
  }, [weapon.id, weapon.images_json, weapon.image_path]);

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [uploadMode, setUploadMode] = useState<'replace' | 'append'>('replace');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [manualUrl, setManualUrl] = useState("");
  const [isSubmittingUrl, setIsSubmittingUrl] = useState(false);

  const handleManualUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualUrl.trim()) return;
    setIsSubmittingUrl(true);
    setUploadError(null);
    try {
      let updatedImages = [];
      if (uploadMode === 'replace') {
        updatedImages = [manualUrl.trim()];
      } else {
        updatedImages = [...localImages, manualUrl.trim()];
      }
      const res = await fetch(`/api/weapons/${weapon.id}/images`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: updatedImages }),
      });
      const data = await res.json();
      if (data.success) {
        setLocalImages(updatedImages);
        setActiveImageIdx(0);
        setManualUrl("");
        if (onRefresh) {
          onRefresh();
        }
      } else {
        setUploadError(data.message || "Failed to update weapon images");
      }
    } catch (err: any) {
      setUploadError(err.message || "Manual registration failed");
    } finally {
      setIsSubmittingUrl(false);
    }
  };

  const handleFilesUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (files.length > 5) {
      setUploadError("Upload limit exceeded: You can load a maximum of 5 images at once.");
      return;
    }
    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i]);
      }
      const res = await fetch(`/api/weapons/${weapon.id}/upload?mode=${uploadMode}`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setLocalImages(data.images);
        setActiveImageIdx(0);
        if (onRefresh) {
          onRefresh();
        }
      } else {
        setUploadError(data.message || "Failed to upload weapon reference images");
      }
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Something went wrong during upload");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (idxToDelete: number) => {
    const remaining = localImages.filter((_, idx) => idx !== idxToDelete);
    try {
      const res = await fetch(`/api/weapons/${weapon.id}/images`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: remaining }),
      });
      const data = await res.json();
      if (data.success) {
        setLocalImages(remaining);
        setActiveImageIdx(0);
        if (onRefresh) {
          onRefresh();
        }
      }
    } catch (e) {
      console.error("Failed to delete weapon image", e);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFilesUpload(e.dataTransfer.files);
    }
  };

  const activeImage = localImages[activeImageIdx] || weapon.image_path || "";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-5">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-theme-bg/95 backdrop-blur-md"
      />

      <motion.div
        initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.98, opacity: 0 }}
        className="relative bg-theme-surface border border-theme-border rounded-3xl w-full max-w-[95vw] h-[92vh] flex flex-col overflow-hidden shadow-[0_0_80px_rgba(255,183,197,0.15)] z-10"
      >
        {/* Workspace Top Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-theme-border p-5 bg-[#0f0f10]">
          <div className="flex items-center gap-4 text-left">
            <span className="w-8 h-8 rounded-full bg-[#FF5A79]/10 flex items-center justify-center font-mono font-black text-xs text-[#FF5A79] border border-[#FF5A79]/20">
              {weapon.id}
            </span>
            <div>
              <p className="text-[10px] text-[#FF5A79] uppercase tracking-[0.34em] font-mono font-black">
                WEAPON INSTANCE DIGITAL ARCHIVE
              </p>
              <h3 className="text-theme-text text-xl font-black uppercase tracking-tighter italic">
                {weapon.name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 bg-[#171719] border border-theme-border rounded-xl font-mono text-[9px] text-[#E6BF5C] font-black uppercase tracking-wider">
              GRIP: {weapon.hand_grip}
            </span>
            <span className="px-3 py-1.5 bg-[#171719] border border-theme-border rounded-xl font-mono text-[9px] text-theme-muted font-black uppercase tracking-wider">
              CAT: {weapon.category}
            </span>
            <button 
              onClick={onClose}
              className="p-2.5 bg-[#202022] hover:bg-[#e14866] hover:text-white rounded-xl text-theme-muted transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Panel Split */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0 text-left">
          
          {/* Main Showcase / Focused Viewer */}
          <div className="flex-1 bg-black/60 relative flex flex-col items-center justify-center p-6 border-b lg:border-b-0 lg:border-r border-theme-border overflow-hidden group">
            <div className="absolute inset-0 bg-[#0c0c0d] opacity-90 pointer-events-none" />
            
            {/* Grid background matching actions */}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

            {activeImage ? (
              <div className="relative z-10 max-w-full max-h-[50vh] lg:max-h-[60vh] aspect-square rounded-2xl overflow-hidden border border-theme-border/60 shadow-2xl flex items-center justify-center bg-theme-bg/30">
                <img src={activeImage} referrerPolicy="no-referrer" className="w-auto h-full max-h-[50vh] lg:max-h-[60vh] object-contain p-6 transform hover:scale-105 transition-transform duration-500" />
              </div>
            ) : (
              <div className="relative z-10 flex flex-col items-center gap-4 text-theme-muted">
                <Sword className="w-16 h-16 opacity-20 animate-pulse" />
                <p className="text-xs font-mono uppercase tracking-widest">No primary asset image available</p>
              </div>
            )}

            {/* Slider/Scrubber Indicators */}
            {localImages.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 border border-theme-border/80 px-4 py-2.5 rounded-full flex items-center gap-2.5 z-20 backdrop-blur-md">
                {localImages.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImageIdx(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${idx === activeImageIdx ? 'bg-[#FF5A79] scale-125' : 'bg-[#3e3e42] hover:bg-theme-muted'}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Uploader Workspace panel & image management (Middle/Right) */}
          <div className="h-[50vh] lg:h-auto lg:flex-1 overflow-y-auto bg-theme-surface custom-scrollbar text-left flex flex-col">
            <div className="p-6 sm:p-10 space-y-8 flex-1">
              <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FF5A79] mb-2 font-mono">
                  WEAPON IMAGE MANIFEST
                </h4>
                <p className="text-xs text-[#8d94a0] leading-relaxed font-semibold">
                  Upload multiple physical model frames, blueprints, or concept iterations for this weapon.
                </p>
              </div>

              {/* Upload Mode Selector Option */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#141415] border border-theme-border rounded-xl gap-3">
                <div>
                  <p className="text-[9px] font-black uppercase text-theme-text font-mono tracking-wider">Save Architecture Rule</p>
                  <p className="text-[8px] text-theme-muted font-bold uppercase tracking-wide mt-0.5">Define if uploaded references should write over or integrate with existing storage tracks.</p>
                </div>
                <div className="flex items-center gap-1.5 p-1 bg-[#161618] border border-theme-border rounded-xl self-start sm:self-auto">
                  <button
                    onClick={(e) => { e.stopPropagation(); setUploadMode('replace'); }}
                    className={`px-3 py-1.5 rounded-lg text-[8.5px] uppercase font-black font-mono tracking-widest transition-all ${uploadMode === 'replace' ? 'bg-[#FF5A79] text-white shadow font-extrabold' : 'text-theme-muted hover:text-theme-text'}`}
                  >
                    REPLACE
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setUploadMode('append'); }}
                    className={`px-3 py-1.5 rounded-lg text-[8.5px] uppercase font-black font-mono tracking-widest transition-all ${uploadMode === 'append' ? 'bg-theme-surface border border-theme-border text-theme-accent shadow font-extrabold' : 'text-theme-muted hover:text-theme-text'}`}
                  >
                    APPEND
                  </button>
                </div>
              </div>

              {/* Drag and Drop Box */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-[2rem] p-8 flex flex-col items-center justify-center gap-4 cursor-pointer transition-all duration-300 relative overflow-hidden ${dragActive ? 'border-[#FF5A79] bg-[#FF5A79]/10 shadow-inner' : 'border-[#303033] bg-[#171719]/50 hover:border-[#FF5A79]/50 hover:bg-[#18181a]'}`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  multiple 
                  accept="image/*"
                  onChange={(e) => handleFilesUpload(e.target.files)} 
                />
                
                {isUploading ? (
                  <div className="flex flex-col items-center gap-3 py-4">
                    <Loader2 className="w-10 h-10 text-[#FF5A79] animate-spin" />
                    <p className="text-[10px] font-mono text-theme-muted uppercase tracking-widest font-black">Registering weapon coordinates in archive...</p>
                  </div>
                ) : (
                  <>
                    <div className="p-4 bg-[#141415] rounded-xl border border-theme-border/80">
                      <Upload className="w-6 h-6 text-[#FF5A79]" />
                    </div>
                    <div className="text-center space-y-1.5 max-w-sm">
                      <p className="text-xs text-theme-text font-black uppercase tracking-wider leading-snug">Drag and drop up to 5 weapon images here, or <span className="text-[#FF5A79] underline hover:text-[#FF456a] transition-colors">browse physical drive</span></p>
                      <p className="text-[9px] text-theme-muted uppercase font-mono tracking-widest">
                        Max 5 images at once • PNG, JPG, SVG
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Manual URL Registration Section */}
              <form onSubmit={handleManualUrlSubmit} className="p-5 bg-[#141415] border border-theme-border rounded-xl text-left space-y-4">
                <div>
                  <p className="text-[10px] font-black uppercase text-theme-text font-mono tracking-wider">Manual Reference Image Link Input</p>
                  <p className="text-[8.5px] text-theme-muted font-bold uppercase tracking-wide mt-0.5">
                    Don't have local files? Paste any direct image URL (HTTP/HTTPS or base64 dataURI) below.
                  </p>
                </div>
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    value={manualUrl}
                    onChange={(e) => setManualUrl(e.target.value)}
                    placeholder="e.g. https://images.unsplash.com/photo-..."
                    className="flex-1 bg-theme-bg text-theme-text font-mono placeholder:text-theme-muted text-xs border border-theme-border/80 rounded-xl px-4 py-2.5 focus:outline-none focus:border-[#FF5A79]"
                  />
                  <button
                    type="submit"
                    disabled={isSubmittingUrl || !manualUrl.trim()}
                    className="px-5 bg-[#FF5A79] hover:bg-[#FF456a] disabled:bg-[#252528] disabled:text-theme-muted text-white text-xs rounded-xl font-bold transition-all whitespace-nowrap inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSubmittingUrl ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    Add Link
                  </button>
                </div>
              </form>

              {uploadError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] text-red-400 font-mono">
                  FAIL: {uploadError}
                </div>
              )}

              {/* Grid of registered images (CRUD list) */}
              <div className="space-y-4 pt-4 border-t border-theme-border">
                <h5 className="text-[10px] font-mono uppercase font-black tracking-[0.2em] text-[#8d94a0]">
                  REGISTERED WEAPON IMAGES ({localImages.length})
                </h5>

                {localImages.length === 0 ? (
                  <div className="p-12 text-center bg-[#151517]/40 border border-theme-border rounded-[2rem] flex flex-col items-center gap-3">
                    <ImageIcon className="w-8 h-8 text-theme-muted opacity-40 animate-pulse" />
                    <p className="text-[10px] uppercase font-black tracking-widest font-mono text-theme-muted">Ready to receive weapon visuals</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {localImages.map((imgUrl, i) => (
                      <div 
                        key={i} 
                        onClick={() => setActiveImageIdx(i)}
                        className={`group cursor-pointer bg-[#18181a] border rounded-xl overflow-hidden relative shadow-lg transition-all duration-300 ${i === activeImageIdx ? 'border-[#FF5A79]' : 'border-theme-border hover:border-[#FF5A79]/50'}`}
                      >
                        <div className="aspect-square bg-black flex items-center justify-center overflow-hidden">
                          <img src={imgUrl} className="w-full h-full object-cover saturate-50 group-hover:saturate-100 transition-all duration-350" />
                        </div>
                        
                        <div className="p-2 border-t border-theme-border bg-[#151517] text-center">
                          <p className="text-[8px] font-mono text-theme-text uppercase font-black truncate">
                            view_#{i + 1}
                          </p>
                        </div>

                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (confirm(t('confirm_delete') || "Remove this weapon illustration reference?")) {
                              await handleDeleteImage(i);
                            }
                          }}
                          className="absolute top-2 right-2 p-1.5 bg-red-600 hover:bg-red-500 rounded text-white opacity-0 group-hover:opacity-100 transition-all duration-200 shadow"
                          title="Remove weapon frame"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar-inspired details section */}
            <div className="p-6 bg-theme-bg/50 border-t border-theme-border space-y-4 font-mono text-[10px]">
              <div>
                <span className="block text-theme-muted uppercase tracking-wider font-bold mb-1">Functional Description Spec</span>
                <p className="text-theme-text font-serif italic text-xs leading-relaxed font-normal">
                  {weapon.description || "A pristine survival horror armament, saved successfully within sandbox files."}
                </p>
              </div>
              <div className="flex justify-between items-center text-[8.5px] tracking-wider pt-2 border-t border-theme-border/60">
                <span>STATUS: ARCHIVED_IN_DB</span>
                <span className="text-[#FF5A79] font-black">{weapon.id}</span>
              </div>
            </div>

          </div>
        </div>
      </motion.div>
    </div>
  );
}

// --- Kinematic Forge Section ---

function KinematicForge({ actions, weapons, t }: { actions: Action[], weapons: Weapon[], t: any }) {
  const [activeForge, setActiveForge] = useState<'pose' | 'weapon' | 'composer'>('pose');
  const [characterImage, setCharacterImage] = useState<string | null>(null);
  const [selectedPose, setSelectedPose] = useState<string>("");
  const [selectedWeapons, setSelectedWeapons] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [outputs, setOutputs] = useState<string[]>([]);

  // Composer state
  const [composerKeyframes, setComposerKeyframes] = useState<{ type: 'action' | 'text', value: string }[]>([
    { type: 'action', value: '' },
    { type: 'action', value: '' }
  ]);
  const [composerPrompt, setComposerPrompt] = useState("");

  const handleRetarget = async () => {
    if (!characterImage || !selectedPose) return;
    setGenerating(true);
    
    try {
      const action = actions.find(a => a.id === selectedPose);
      if (!action) return;

      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const prompt = `Act as a professional animation director for a survival horror anime. 
      I have a character reference image and I want to retarget the action "${action.verb_name}" (Category: ${action.category}) onto this character.
      
      Describe in detail how this character would perform the ${action.verb_name} action, focusing on anatomical weight, silhouette, and the "survival horror" aesthetic. 
      Specifically mention 4 distinct frames of the animation with descriptions of their visual composition.`;

      const result = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      console.log("Retargeting Blueprint:", result.text);

      setOutputs(new Array(6).fill("").map((_, i) => `https://picsum.photos/seed/lighthouse_${selectedPose}_${i}/400/600?grayscale`));
    } catch (err) {
      console.error("Forge Error:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleWeaponMerge = async () => {
    if (selectedWeapons.length < 2) return;
    setGenerating(true);
    
    try {
      const selectedNames = weapons.filter(w => selectedWeapons.includes(w.id)).map(w => w.name).join(" and ");
      
      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const prompt = `You are a legendary weapon smith for an apocalyptic survival horror game. 
      I am combining the following weapons: ${selectedNames}.
      Describe the resulting 'Fusion Instance'. What are its unique attributes, how is it constructed, and what is its name?`;

      const result = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      console.log("Synthesis Result:", result.text);

      setOutputs([`https://picsum.photos/seed/weapon_fusion_${Date.now()}/500/500?blur=1`]);
    } catch (err) {
      console.error("Fusion Forge Error:", err);
    } finally {
      setGenerating(false);
    }
  };

  const handleMotionComposer = async () => {
    setGenerating(true);
    try {
      const keyframeDescriptions = composerKeyframes.map((kf, i) => {
        if (kf.type === 'action') {
          const action = actions.find(a => a.id === kf.value);
          return `Keyframe ${i+1}: Action "${action?.verb_name || 'Undefined'}"`;
        }
        return `Keyframe ${i+1}: Text Prompt "${kf.value}"`;
      }).join("\n");

      const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
      const prompt = `You are a Procedural Motion Interpolator for 'Keyframe Forge'.
      Goal: Create a seamless animation loop (Survival Horror aesthetic) by bridging these keyframes:
      ${keyframeDescriptions}
      
      User Intent: ${composerPrompt}
      
      Instructions:
      1. Analyze the transition from Keyframe 1 to Keyframe 2.
      2. Identify the anatomical 'bridges' (intermediate poses) needed for a smooth 12-frame sequence.
      3. Describe the 'Motion Path' and 'Silhouette Persistence'.
      4. Suggest a name for this new Composite Action.`;

      const result = await genAI.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt
      });
      console.log("Motion Interpolation Plan:", result.text);

      setOutputs(new Array(8).fill("").map((_, i) => `https://picsum.photos/seed/composer_${i}_${Date.now()}/400/600?grayscale&blur=2`));
    } catch (err) {
      console.error("Composer Error:", err);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-12 pb-12">
      <SectionHeading title={t('forge_h')} subtitle={t('forge_sh')} />
      
      <div className="flex gap-4">
        <Tooltip content="Transform human video to anime reference">
          <button 
            onClick={() => { setActiveForge('pose'); setOutputs([]); }}
            className={`flex-1 p-6 rounded-2xl border-2 transition-all flex flex-col items-center text-center group shadow-sm ${activeForge === 'pose' ? 'bg-theme-accent/5 border-theme-accent text-theme-text' : 'bg-theme-surface border-theme-border text-theme-muted hover:border-theme-accent-blue/30'}`}
          >
            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors ${activeForge === 'pose' ? 'bg-theme-accent text-white shadow-lg shadow-theme-accent/30' : 'bg-theme-bg text-theme-muted group-hover:text-theme-accent'}`}>
              <User className="w-6 h-6" />
            </div>
            <p className="text-xs uppercase tracking-[0.2em] font-black">{t('retarget_eng')}</p>
            <p className="text-[10px] opacity-60 mt-1 uppercase font-bold font-mono italic">{t('retarget_desc')}</p>
          </button>
        </Tooltip>
        
        <Tooltip content="Merge weapon assets using procedural synthesis">
          <button 
            onClick={() => { setActiveForge('weapon'); setOutputs([]); }}
            className={`flex-1 p-6 rounded-2xl border-2 transition-all flex flex-col items-center text-center group shadow-sm ${activeForge === 'weapon' ? 'bg-theme-accent/5 border-theme-accent text-theme-text' : 'bg-theme-surface border-theme-border text-theme-muted hover:border-theme-accent-blue/30'}`}
          >
             <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors ${activeForge === 'weapon' ? 'bg-theme-accent text-white shadow-lg shadow-theme-accent/30' : 'bg-theme-bg text-theme-muted group-hover:text-theme-accent'}`}>
              <Sword className="w-6 h-6" />
            </div>
            <p className="text-xs uppercase tracking-[0.2em] font-black">{t('fusion_proc')}</p>
            <p className="text-[10px] opacity-60 mt-1 uppercase font-bold font-mono italic">{t('fusion_desc')}</p>
          </button>
        </Tooltip>

        <Tooltip content="Bridge keyframes for smooth motion">
          <button 
            onClick={() => { setActiveForge('composer'); setOutputs([]); }}
            className={`flex-1 p-6 rounded-2xl border-2 transition-all flex flex-col items-center text-center group shadow-sm ${activeForge === 'composer' ? 'bg-theme-accent/5 border-theme-accent text-theme-text' : 'bg-theme-surface border-theme-border text-theme-muted hover:border-theme-accent-blue/30'}`}
          >
             <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 transition-colors ${activeForge === 'composer' ? 'bg-theme-accent text-white shadow-lg shadow-theme-accent/30' : 'bg-theme-bg text-theme-muted group-hover:text-theme-accent'}`}>
              <LayoutGrid className="w-6 h-6" />
            </div>
            <p className="text-xs uppercase tracking-[0.2em] font-black">{t('motion_comp')}</p>
            <p className="text-[10px] opacity-60 mt-1 uppercase font-bold font-mono italic">{t('motion_desc')}</p>
          </button>
        </Tooltip>
      </div>

      <div className="grid lg:grid-cols-12 gap-8">
        <section className="lg:col-span-4 space-y-6">
          <div className="bg-theme-surface border border-theme-border rounded-2xl p-6 relative overflow-hidden">
            <h3 className="text-[10px] font-mono text-theme-accent uppercase tracking-widest mb-6 flex items-center gap-2">
              <span className="w-1 h-3 bg-theme-accent"></span> {t('input_params')}
            </h3>
            
            {activeForge === 'pose' && (
              <div className="space-y-6">
                <div className="aspect-[3/4] bg-theme-bg border-2 border-dashed border-theme-border rounded-xl flex flex-col items-center justify-center p-4 group hover:border-theme-accent/50 transition-all cursor-pointer relative overflow-hidden">
                  {characterImage ? (
                    <img src={characterImage} className="w-full h-full object-contain" />
                  ) : (
                    <>
                      <LighthouseLogo className="w-20 h-20 text-theme-accent/60 mb-3 group-hover:text-theme-accent transition-all group-hover:scale-110 active:scale-95" />
                      <p className="text-[9px] uppercase tracking-widest text-theme-muted text-center leading-relaxed">{t('drop_char')}<br/>{t('char_types')}</p>
                    </>
                  )}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) setCharacterImage(URL.createObjectURL(file));
                  }} />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[9px] text-theme-muted uppercase tracking-[0.2em] font-mono block ml-1">Target_Action_Link</label>
                  <select 
                    className="w-full bg-theme-bg border border-theme-border rounded-lg px-4 py-3 text-xs focus:outline-none focus:border-theme-accent transition-colors appearance-none text-white tracking-widest uppercase font-mono"
                    value={selectedPose}
                    onChange={e => setSelectedPose(e.target.value)}
                  >
                    <option value="">{t('select_db')}</option>
                    {actions.map(a => <option key={a.id} value={a.id} className="bg-theme-surface">{a.verb_name}</option>)}
                  </select>
                </div>

                <button 
                  onClick={handleRetarget}
                  disabled={generating || !characterImage || !selectedPose}
                  className="w-full py-4 bg-theme-accent text-theme-bg rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                >
                  {generating ? t('processing') : t('engage_retarget')}
                </button>
              </div>
            )}

            {activeForge === 'weapon' && (
              <div className="space-y-6">
                <div className="space-y-3">
                  <p className="text-[9px] text-theme-muted uppercase tracking-[0.2em] font-mono ml-1">{t('instance_select')}</p>
                  <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto p-2 bg-theme-bg rounded-xl border border-theme-border custom-scrollbar">
                    {weapons.map(w => (
                      <div 
                        key={w.id} 
                        onClick={() => setSelectedWeapons(prev => prev.includes(w.id) ? prev.filter(id => id !== w.id) : [...prev, w.id])}
                        className={`p-2 rounded-lg border-2 cursor-pointer transition-all ${selectedWeapons.includes(w.id) ? 'bg-theme-accent/10 border-theme-accent' : 'bg-theme-surface border-transparent hover:border-theme-border-light'}`}
                      >
                        <div className="aspect-square bg-theme-bg rounded mb-2 overflow-hidden flex items-center justify-center">
                          {w.image_path ? <img src={w.image_path} className="w-full h-full object-contain p-1" /> : <Sword className="w-4 h-4 text-theme-muted opacity-20" />}
                        </div>
                        <p className="text-[7px] uppercase tracking-tighter truncate text-center text-theme-muted group-hover:text-white">{w.name}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-theme-accent/5 border border-theme-accent/20 rounded-xl italic text-[9px] text-theme-accent leading-relaxed text-center font-mono">
                  {t('synthesis_logic')}
                </div>

                <button 
                  onClick={handleWeaponMerge}
                  disabled={generating || selectedWeapons.length < 2}
                  className="w-full py-4 bg-theme-accent text-theme-bg rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                >
                  {generating ? t('synthesizing') : t('execute_fusion')}
                </button>
              </div>
            )}

            {activeForge === 'composer' && (
              <div className="space-y-6">
                <div className="space-y-4">
                  {composerKeyframes.map((kf, i) => (
                    <div key={i} className="space-y-2 p-3 bg-theme-bg border border-theme-border rounded-xl">
                      <div className="flex items-center justify-between">
                          <label className="text-[8px] text-theme-muted uppercase font-mono tracking-widest">Keyframe_{i+1}</label>
                          <div className="flex gap-2">
                             <button 
                               onClick={() => {
                                 const next = [...composerKeyframes];
                                 next[i].type = 'action';
                                 setComposerKeyframes(next);
                               }}
                               className={`text-[7px] uppercase px-1.5 py-0.5 rounded ${kf.type === 'action' ? 'bg-theme-accent text-theme-bg' : 'bg-theme-surface text-theme-muted'}`}
                             >{t('action_type')}</button>
                             <button 
                               onClick={() => {
                                 const next = [...composerKeyframes];
                                 next[i].type = 'text';
                                 setComposerKeyframes(next);
                               }}
                               className={`text-[7px] uppercase px-1.5 py-0.5 rounded ${kf.type === 'text' ? 'bg-theme-accent text-theme-bg' : 'bg-theme-surface text-theme-muted'}`}
                             >{t('text_type')}</button>
                          </div>
                        </div>
                        {kf.type === 'action' ? (
                          <select 
                            className="w-full bg-theme-surface border border-theme-border rounded px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-theme-accent uppercase font-mono"
                            value={kf.value}
                            onChange={e => {
                              const next = [...composerKeyframes];
                              next[i].value = e.target.value;
                              setComposerKeyframes(next);
                            }}
                          >
                            <option value="">{t('select_db')}</option>
                            {actions.map(a => <option key={a.id} value={a.id}>{a.verb_name}</option>)}
                          </select>
                        ) : (
                          <input 
                            className="w-full bg-theme-surface border border-theme-border rounded px-2 py-1.5 text-[10px] text-white focus:outline-none focus:border-theme-accent placeholder:opacity-20"
                            placeholder={t('describe_pose')}
                            value={kf.value}
                            onChange={e => {
                              const next = [...composerKeyframes];
                              next[i].value = e.target.value;
                              setComposerKeyframes(next);
                            }}
                          />
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] text-theme-muted uppercase tracking-[0.2em] font-mono block ml-1">{t('synthesis_intent')}</label>
                    <textarea 
                      className="w-full h-24 bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-xs focus:outline-none focus:border-theme-accent transition-colors text-white placeholder:opacity-20 resize-none font-mono"
                      placeholder="e.g. 'Jump with Hook weapon' - combine a parabolic leap with a sudden lateral claw strike."
                      value={composerPrompt}
                      onChange={e => setComposerPrompt(e.target.value)}
                    />
                  </div>

                  <button 
                  onClick={handleMotionComposer}
                  disabled={generating || !composerPrompt}
                  className="w-full py-4 bg-theme-accent text-theme-bg rounded-xl text-[10px] font-bold uppercase tracking-[0.2em] shadow-xl hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-95"
                >
                  {generating ? t('interpolating') : t('gen_seq')}
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="lg:col-span-8 flex flex-col">
           <div className="bg-theme-surface border border-theme-border rounded-2xl flex flex-col relative overflow-hidden flex-1 shadow-sm">
              <div className="p-5 border-b border-theme-border flex items-center justify-between bg-theme-accent/5">
                <h3 className="text-xs font-black text-theme-text uppercase tracking-widest flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-theme-accent animate-pulse shadow-[0_0_10px_#ffb7c5]"></span>
                  {t('output_stream')} <span className="text-theme-muted">| 橋</span>
                </h3>
                <div className="text-[9px] font-bold font-mono text-theme-muted uppercase tracking-widest">{t('buffer_status')}: {generating ? t('status_processing') : outputs.length > 0 ? t('status_verified') : t('status_standby')}</div>
              </div>
              
              <div className="flex-grow p-8 flex items-center justify-center bg-theme-bg relative">
                {generating ? (
                  <div className="flex flex-col items-center gap-8 relative z-10">
                     <div className="w-16 h-16 border-4 border-theme-accent/20 border-t-theme-accent rounded-full animate-spin"></div>
                     <p className="text-[10px] font-black font-mono uppercase tracking-[0.4em] animate-pulse text-theme-accent">{t('pathmapping')}</p>
                  </div>
                ) : outputs.length > 0 ? (
                  <div className={`grid gap-6 w-full h-full ${activeForge === 'pose' ? 'grid-cols-2 md:grid-cols-3' : activeForge === 'composer' ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 max-w-lg mx-auto'}`}>
                     {outputs.map((url, i) => (
                       <motion.div 
                          key={i} 
                          initial={{ opacity: 0, scale: 0.9 }} 
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="group relative bg-white rounded-xl border border-theme-border overflow-hidden shadow-md hover:border-theme-accent/40 transition-colors"
                       >
                          <img src={url} className="w-full h-full object-cover saturate-50 group-hover:saturate-100 transition-all" />
                          <div className="absolute inset-0 bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4">
                             <button className="px-6 py-3 bg-theme-accent text-white rounded font-black text-[9px] uppercase tracking-widest hover:bg-theme-text transition-all shadow-xl">{t('save_asset')}</button>
                          </div>
                          <div className="absolute bottom-2 left-2 px-2 py-1 bg-white/80 backdrop-blur rounded text-[8px] border border-theme-border font-black font-mono text-theme-accent-blue uppercase tracking-tighter">F_{i+1}</div>
                       </motion.div>
                     ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-6 opacity-20">
                     <Zap className="w-20 h-20 text-theme-accent" />
                     <p className="text-[11px] font-black font-mono uppercase tracking-[0.5em] text-center text-theme-text">{t('standby_synth')}</p>
                  </div>
                )}

                
                {/* Visual accents */}
                <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-theme-accent/30"></div>
                <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-theme-accent/30"></div>
                <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-theme-accent/30"></div>
                <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-theme-accent/30"></div>
              </div>

              <div className="p-4 border-t border-theme-border bg-white flex justify-between items-center px-6">
                <div className="text-[8px] font-bold font-mono text-theme-muted uppercase tracking-widest">
                  FLASH_SAKURA_V1 | SEED: 0x{Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase()} | TEMP: 0.7
                </div>
                <div className="px-3 py-1 bg-theme-accent/10 rounded-full text-[8px] font-black text-theme-accent uppercase tracking-widest">Ready</div>
              </div>
           </div>
        </section>
      </div>
    </div>
  );
}

// --- Admin Section ---

function AdminDashboard({ 
  isAdmin, 
  actions, 
  weapons, 
  onRefresh,
  editingAction,
  setEditingAction,
  editingWeapon,
  setEditingWeapon,
  t
}: { 
  isAdmin: boolean, 
  actions: Action[], 
  weapons: Weapon[], 
  onRefresh: () => void,
  editingAction: Partial<Action> | null,
  setEditingAction: (a: Partial<Action> | null) => void,
  editingWeapon: Partial<Weapon> | null,
  setEditingWeapon: (w: Partial<Weapon> | null) => void,
  t: any
}) {
  const [currentFrames, setCurrentFrames] = useState<string[]>([]);
  const [newUrl, setNewUrl] = useState("");
  const [isSyncing, setIsSyncing] = useState(false);

  const handleRestoreDatabase = async () => {
    if (!confirm("Caution: This will clear out the current active Action Library and Weapon Store, and fully restore all 58 master Anime Action verbs and 50 Survival-Horror Weapons from the design blueprints. Your uploaded frames or edits on pre-seeded entries will be reset to default. Proceed?")) {
      return;
    }
    try {
      setIsSyncing(true);
      const res = await fetch("/api/admin/reset-database", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        onRefresh();
      } else {
        alert("Reset failed: " + (data.error || "Unknown error"));
      }
    } catch (e: any) {
      alert("Error reaching server: " + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    if (editingAction?.frames_json) {
      setCurrentFrames(JSON.parse(editingAction.frames_json));
    } else {
      setCurrentFrames([]);
    }
    setNewUrl("");
  }, [editingAction]);

  const [adminTab, setAdminTab] = useState<'library' | 'studio'>('library');

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center p-24 bg-theme-surface border border-dashed border-theme-border rounded-3xl">
        <div className="w-20 h-20 bg-theme-accent/5 rounded-full flex items-center justify-center mb-8 relative">
           <Lock className="w-8 h-8 text-theme-accent" />
           <div className="absolute inset-0 border-2 border-theme-accent/20 rounded-full animate-ping"></div>
        </div>
        <h3 className="text-xl uppercase tracking-[0.3em] mb-3 font-black text-theme-text italic">{t('restricted')}</h3>
        <p className="text-[10px] uppercase tracking-[0.2em] text-theme-accent font-black font-mono">{t('auth_req')}</p>
      </div>
    );
  }

  const handleDeleteAction = async (id: string) => {
    if (!confirm("Confirm permanent deletion of motion verb sequence?")) return;
    await fetch(`/api/actions/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  const handleSaveAction = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    formData.append('existing_frames', JSON.stringify(currentFrames));
    
    const method = editingAction?.id ? 'PUT' : 'POST';
    const url = editingAction?.id ? `/api/actions/${editingAction.id}` : '/api/actions';
    
    await fetch(url, { method, body: formData });
    setEditingAction(null);
    onRefresh();
  };

  const addUrlFrame = () => {
    if (!newUrl) return;
    setCurrentFrames([...currentFrames, newUrl]);
    setNewUrl("");
  };

  const removeFrame = (index: number) => {
    setCurrentFrames(currentFrames.filter((_, i) => i !== index));
  };

  const handleSaveWeapon = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const method = editingWeapon?.id ? 'PUT' : 'POST';
    const url = editingWeapon?.id ? `/api/weapons/${editingWeapon.id}` : '/api/weapons';
    
    await fetch(url, { method, body: formData });
    setEditingWeapon(null);
    onRefresh();
  };

  const handleDeleteWeapon = async (id: string) => {
    if (!confirm("Confirm permanent deletion of this weapon reference?")) return;
    await fetch(`/api/weapons/${id}`, { method: 'DELETE' });
    onRefresh();
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 border-b border-theme-border pb-4">
        <div className="flex gap-4">
          <button 
            onClick={() => setAdminTab('library')}
            className={`px-8 py-3 text-[10px] uppercase font-black tracking-[0.2em] transition-all rounded-full flex items-center gap-2 ${adminTab === 'library' ? 'bg-theme-accent text-white shadow-lg shadow-theme-accent/20' : 'text-theme-muted hover:text-theme-text hover:bg-theme-bg'}`}
          >
            <Database className="w-3 h-3" /> {t('nav_library')}
          </button>
          <button 
            onClick={() => setAdminTab('studio')}
            className={`px-8 py-3 text-[10px] uppercase font-black tracking-[0.2em] transition-all rounded-full flex items-center gap-2 ${adminTab === 'studio' ? 'bg-theme-accent text-white shadow-lg shadow-theme-accent/20' : 'text-theme-muted hover:text-theme-text hover:bg-theme-bg'}`}
          >
            <Sparkles className="w-3 h-3" /> {t('proto_h')}
          </button>
        </div>
        <button
          onClick={handleRestoreDatabase}
          disabled={isSyncing}
          className="px-6 py-2.5 rounded-full bg-red-650/10 hover:bg-red-650 border border-red-500/20 hover:border-red-500 text-red-500 hover:text-white text-[9px] uppercase tracking-wider font-extrabold transition-all flex items-center gap-2 shadow-lg shadow-red-500/5 disabled:opacity-50"
        >
          <Database className="w-3.5 h-3.5" />
          {isSyncing ? "RESTORING COMPREHENSIVE ARCHIVE..." : "RESTORE ORIGINAL DATABASE"}
        </button>
      </div>

      {adminTab === 'library' ? (
        <div className="space-y-12">
          <section className="bg-theme-surface border border-theme-border p-8 rounded-2xl relative overflow-hidden">
            <div className="flex justify-between items-center mb-10">
               <SectionHeading title={t('motion_db')} subtitle="Verb Entry Management" />
               <button onClick={() => setEditingAction({})} className="flex items-center gap-3 px-6 py-2.5 bg-theme-accent text-theme-bg rounded font-bold text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-lg shadow-theme-accent/20"><Plus className="w-4 h-4" /> {t('establish_auth')}</button>
            </div>

            <div className="overflow-x-auto rounded-xl border border-theme-border bg-white shadow-sm">
               <table className="w-full text-left font-mono text-[11px]">
                  <thead className="bg-theme-bg text-theme-muted uppercase tracking-widest border-b border-theme-border">
                     <tr>
                        <th className="p-5 font-black text-theme-text">{t('field_verb')}</th>
                        <th className="p-5 font-black text-theme-text">{t('field_category')}</th>
                        <th className="p-5 font-black text-theme-text text-right">Operations</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-border">
                     {actions.map(action => (
                       <tr key={action.id} className="hover:bg-theme-accent/5 transition-colors group">
                          <td className="p-5 text-theme-text font-black">{action.verb_name}</td>
                          <td className="p-5 italic"><span className="px-3 py-1 bg-white rounded border border-theme-border text-theme-accent text-[9px] font-black uppercase tracking-tighter">{action.category}</span></td>
                          <td className="p-5 text-right">
                             <div className="flex justify-end gap-3">
                                <button onClick={() => setEditingAction(action)} className="w-9 h-9 flex items-center justify-center bg-theme-bg border border-theme-border rounded-lg text-theme-muted hover:text-theme-accent hover:border-theme-accent transition-all"><Edit3 className="w-4 h-4" /></button>
                                <button onClick={() => handleDeleteAction(action.id)} className="w-9 h-9 flex items-center justify-center bg-theme-bg border border-theme-border rounded-lg text-theme-muted hover:text-red-500 hover:border-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
                             </div>
                          </td>
                       </tr>
                     ))}
                  </tbody>
               </table>
            </div>
          </section>

          <section className="bg-theme-surface border border-theme-border p-8 rounded-2xl shadow-sm">
             <div className="flex justify-between items-center mb-10">
               <SectionHeading title={t('weapon_db')} subtitle={t('weapon_storage')} />
               <button onClick={() => setEditingWeapon({})} className="flex items-center gap-3 px-6 py-2.5 bg-theme-accent text-white rounded font-black text-[10px] uppercase tracking-widest hover:bg-theme-text transition-all shadow-lg shadow-theme-accent/20"><Plus className="w-4 h-4" /> {t('admin_title_weapon')}</button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4">
               {weapons.map(w => (
                 <div key={w.id} className="p-4 bg-theme-bg rounded-xl border border-theme-border relative group hover:border-theme-accent/50 transition-all shadow-sm flex flex-col justify-between">
                    <div>
                       <div className="aspect-square bg-white mb-3 rounded-lg flex items-center justify-center overflow-hidden border border-theme-border shadow-inner relative">
                          {w.image_path ? <img src={w.image_path} className="w-full h-full object-contain p-2 saturate-50 group-hover:saturate-100 transition-all" /> : <Sword className="opacity-20 text-theme-accent" />}
                          <span className="absolute bottom-1 right-1 px-1 py-0.5 bg-theme-bg/85 backdrop-blur rounded text-[6px] font-mono font-bold tracking-tighter text-theme-accent">{w.hand_grip}</span>
                       </div>
                       <p className="text-[9px] uppercase tracking-widest text-center text-theme-text font-black font-mono truncate" title={w.name}>{w.name}</p>
                       <p className="text-[7.5px] uppercase text-center font-extrabold text-theme-accent mt-0.5 mb-2 tracking-wide font-mono truncate">{w.category}</p>
                    </div>
                    <div className="flex gap-1.5 justify-center mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                       <button onClick={() => setEditingWeapon(w)} className="px-2.5 py-1 bg-white hover:bg-theme-accent hover:text-white border border-theme-border rounded text-[7.5px] font-mono font-bold tracking-tight shadow-sm transition-all flex items-center gap-1 leading-none uppercase">EDIT</button>
                       <button onClick={() => handleDeleteWeapon(w.id)} className="px-2.5 py-1 bg-white hover:bg-red-500 hover:text-white border border-theme-border rounded text-[7.5px] font-mono font-bold tracking-tight shadow-sm transition-all flex items-center gap-1 leading-none uppercase">DEL</button>
                    </div>
                 </div>
               ))}
            </div>
          </section>
        </div>
      ) : (
        <PrototypeStudio actions={actions} onRefresh={onRefresh} t={t} />
      )}

      {/* Editor Modal for Action */}
      <AnimatePresence>
        {editingAction && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingAction(null)} className="absolute inset-0 bg-theme-bg/80 backdrop-blur-md" />
            <motion.form 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onSubmit={handleSaveAction}
              className="relative bg-white border border-theme-border rounded-3xl p-10 w-full max-w-lg shadow-[0_0_80px_rgba(255,183,197,0.1)]"
            >
              <h2 className="text-xl italic uppercase tracking-widest mb-8 font-black text-theme-text border-l-4 border-theme-accent pl-4">{editingAction.id ? 'UPDATE_ENTRY' : t('admin_title_action')}</h2>
              <div className="space-y-6">
                 <div>
                    <label className="text-[9px] text-theme-muted uppercase tracking-[0.3em] block mb-2 font-black font-mono">{t('field_verb')}</label>
                    <input name="verb_name" defaultValue={editingAction.verb_name} placeholder="e.g. SLICE_VERTICAL" required className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-theme-accent-blue transition-all text-theme-text font-mono placeholder:opacity-40" />
                 </div>
                 <div>
                    <label className="text-[9px] text-theme-muted uppercase tracking-[0.3em] block mb-2 font-black font-mono">{t('field_category')}</label>
                    <select name="category" defaultValue={editingAction.category} className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3.5 text-sm focus:outline-none focus:border-theme-accent-blue transition-all text-theme-text font-mono appearance-none uppercase tracking-widest font-black">
                       <option>Locomotion</option>
                       <option>Combat</option>
                       <option>Death</option>
                       <option>Interaction</option>
                       <option>Idle</option>
                       <option>Reactions</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-[9px] text-theme-muted uppercase tracking-[0.3em] block mb-2 font-black font-mono">{t('field_frames')}</label>
                    
                    {/* Granular Frame Management */}
                    <div className="space-y-4">
                       <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto p-3 bg-theme-bg border border-theme-border rounded-xl custom-scrollbar">
                          {currentFrames.map((frame, i) => (
                            <div key={i} className="aspect-square bg-white border border-theme-border rounded relative group">
                               <img src={frame} className="w-full h-full object-cover rounded saturate-50" />
                               <button 
                                 type="button"
                                 onClick={() => removeFrame(i)}
                                 className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                               >
                                 <Trash2 className="w-2 h-2" />
                               </button>
                               <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-[6px] text-white text-center py-0.5 truncate px-1">F_{i+1}</div>
                            </div>
                          ))}
                          {currentFrames.length === 0 && (
                            <div className="col-span-4 py-8 text-center text-theme-muted text-[8px] uppercase font-mono italic opacity-40">{t('field_zero_frames')}</div>
                          )}
                       </div>

                       <div className="flex gap-2">
                          <input 
                            value={newUrl} 
                            onChange={e => setNewUrl(e.target.value)}
                            placeholder="Paste frame URL..."
                            className="flex-1 bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-[10px] focus:outline-none focus:border-theme-accent-blue transition-all text-theme-text font-mono placeholder:opacity-40"
                          />
                          <button 
                            type="button" 
                            onClick={addUrlFrame}
                            className="px-4 bg-theme-bg border border-theme-border rounded-xl text-theme-accent hover:border-theme-accent transition-all"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                       </div>

                       <div className="relative group">
                          <input type="file" name="frames" multiple className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                          <div className="bg-theme-bg border border-theme-border rounded-xl p-4 flex items-center justify-between group-hover:bg-theme-accent/5 group-hover:border-theme-accent/50 transition-all border-dashed">
                             <div className="flex items-center gap-3">
                                <Upload className="w-4 h-4 text-theme-accent" />
                                <span className="text-[10px] text-theme-muted uppercase font-black font-mono">{t('field_upload_batch')}</span>
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="flex gap-4 mt-10">
                 <button type="button" onClick={() => setEditingAction(null)} className="flex-1 py-4 border-2 border-theme-border rounded-xl text-[10px] uppercase font-black tracking-widest text-theme-muted hover:text-theme-text hover:border-theme-accent-blue transition-all">{t('btn_abort')}</button>
                 <button type="submit" className="flex-1 py-4 bg-theme-accent text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-theme-text transition-all shadow-xl shadow-theme-accent/20">{t('btn_commit')}</button>
              </div>
            </motion.form>
          </div>
        )}

        {editingWeapon && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditingWeapon(null)} className="absolute inset-0 bg-theme-bg/80 backdrop-blur-md" />
            <motion.form 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onSubmit={handleSaveWeapon}
              className="relative bg-theme-surface border border-theme-border rounded-2xl p-10 w-full max-w-lg shadow-[0_0_80px_rgba(0,0,0,0.8)]"
            >
              <h2 className="text-xl italic uppercase tracking-widest mb-8 font-bold text-white border-l-4 border-theme-accent pl-4">{editingWeapon.id ? 'UPDATE_WEAPON_ENTRY' : t('admin_title_weapon')}</h2>
              <div className="space-y-6">
                 {editingWeapon.image_path && (
                    <div className="flex items-center gap-4 p-3 bg-theme-bg/40 border border-theme-border rounded-xl">
                       <img src={editingWeapon.image_path} className="w-12 h-12 object-contain aspect-square bg-white rounded border border-theme-border p-1" />
                       <div className="text-[10px] text-theme-muted font-mono truncate">
                          CURRENT FILE: {editingWeapon.image_path.split('/').pop()}
                       </div>
                    </div>
                 )}
                 <div>
                    <label className="text-[9px] text-theme-muted uppercase tracking-[0.3em] block mb-2 font-mono">{t('field_weapon_id')}</label>
                    <input name="name" required defaultValue={editingWeapon.name || ""} placeholder="e.g. PLASMA_KATANA" className="w-full bg-theme-bg border border-theme-border rounded px-4 py-3 text-sm focus:outline-none focus:border-theme-accent transition-all text-white font-mono placeholder:opacity-20" />
                 </div>
                 <div>
                    <label className="text-[9px] text-theme-muted uppercase tracking-[0.3em] block mb-2 font-mono">Category</label>
                    <select name="category" required defaultValue={editingWeapon.category || "Melee Blades"} className="w-full bg-theme-bg border border-theme-border rounded px-4 py-3 text-sm focus:outline-none focus:border-theme-accent transition-all text-white font-mono appearance-none uppercase tracking-widest font-bold">
                       <option value="Melee Blades">Melee Blades</option>
                       <option value="Polearms & Bludgeons">Polearms & Bludgeons</option>
                       <option value="Ranged & Projectiles">Ranged & Projectiles</option>
                       <option value="Tactical Utilities">Tactical & Survival Utilities</option>
                       <option value="Futuristic Heavy">Futuristic Heavy Weapons</option>
                       <option value="Magic & Focus Items">Magic & Focus Items</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-[9px] text-theme-muted uppercase tracking-[0.3em] block mb-2 font-mono">Hand Grip</label>
                    <select name="hand_grip" required defaultValue={editingWeapon.hand_grip || "One-Handed"} className="w-full bg-theme-bg border border-theme-border rounded px-4 py-3 text-sm focus:outline-none focus:border-theme-accent transition-all text-white font-mono appearance-none uppercase tracking-widest font-bold">
                       <option value="One-Handed">One-Handed</option>
                       <option value="Two-Handed">Two-Handed</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-[9px] text-theme-muted uppercase tracking-[0.3em] block mb-2 font-mono">Description</label>
                    <textarea name="description" required defaultValue={editingWeapon.description || ""} placeholder="Provide physical mechanical characteristics..." rows={3} className="w-full bg-theme-bg border border-theme-border rounded px-4 py-3 text-sm focus:outline-none focus:border-theme-accent transition-all text-white font-mono placeholder:opacity-20" />
                 </div>
                 <div>
                    <label className="text-[9px] text-theme-muted uppercase tracking-[0.3em] block mb-2 font-mono">
                       {t('field_asset_inst')} {editingWeapon.id && <span className="text-[8px] text-theme-muted font-bold">(OPTIONAL)</span>}
                    </label>
                    <div className="relative group">
                      <input type="file" name="image" required={!editingWeapon.id} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                      <div className="bg-theme-bg border border-theme-border rounded p-4 flex items-center justify-between group-hover:bg-theme-accent/5 group-hover:border-theme-accent/50 transition-all border-dashed">
                        <span className="text-[10px] text-theme-muted uppercase font-mono">
                           {editingWeapon.id ? "UPLOAD TO REPLACE IMAGE REFERENCE" : t('field_upload_static')}
                        </span>
                        <ImageIcon className="w-4 h-4 text-theme-accent" />
                      </div>
                    </div>
                 </div>
              </div>
              <div className="flex gap-4 mt-10">
                 <button type="button" onClick={() => setEditingWeapon(null)} className="flex-1 py-4 border border-theme-border text-[10px] uppercase font-bold tracking-widest text-theme-muted hover:text-white transition-all">{t('btn_abort')}</button>
                 <button type="submit" className="flex-1 py-4 bg-theme-accent text-theme-bg rounded font-bold text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-xl shadow-theme-accent/20">{editingWeapon.id ? "UPDATE LOG" : t('btn_finalize')}</button>
              </div>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Prototype Studio ---

function PrototypeStudio({ actions, onRefresh, t }: { actions: Action[], onRefresh: () => void, t: any }) {
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [prototypes, setPrototypes] = useState<{ url: string, prompt: string, base64: string }[]>([]);
  const [selectedReferenceId, setSelectedReferenceId] = useState<string>("");
  const [characterRef, setCharacterRef] = useState<string | null>(null);
  const [genMode, setGenMode] = useState<'variations' | 'sequence'>('variations');
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [addingToDatabase, setAddingToDatabase] = useState<string | null>(null);

  const selectedAction = actions.find(a => a.id === selectedReferenceId);
  const referenceFrames = selectedAction ? JSON.parse(selectedAction.frames_json) : [];

  const handleSynthesize = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setPrototypes([]);

    try {
      const modeVariations = genMode === 'variations' ? [
        "front view", "side view", "low angle", "high angle", "birds eye view",
        "close up", "full body action", "dynamic pose", "cinematic lighting", "silhouette"
      ] : [
        "Frame 1: Starting pose, anticipation",
        "Frame 2: Initial movement, weight shift",
        "Frame 3: Mid-stride progression",
        "Frame 4: Forward momentum",
        "Frame 5: Central transition pose",
        "Frame 6: Step follow-through",
        "Frame 7: Secondary stride start",
        "Frame 8: Approaching peak action",
        "Frame 9: Near completion of sequence",
        "Frame 10: Final pose, motion conclusion"
      ];

      const newPrototypes: { url: string, prompt: string, base64: string }[] = [];

      const poseBase64 = referenceFrames.length > 0 ? await imageUrlToBase64(referenceFrames[0]) : null;
      const characterBase64 = characterRef ? await imageUrlToBase64(characterRef) : null;

      const generationPromises = modeVariations.map(async (v) => {
        const fullPrompt = `${prompt}, ${v}, high quality anime art style, flat colors, clean lineart, game character sprite sheet style, consistent character features`;
        
        try {
          const contents: any = [{ text: fullPrompt }];
          
          // Add Character Reference (High priority for consistency)
          if (characterBase64) {
            contents.unshift({
               inlineData: {
                  data: characterBase64.split(",")[1],
                  mimeType: "image/png"
               }
            });
            contents.unshift({ text: "Use this image as the BASE CHARACTER for visual consistency:" });
          }

          // Add Pose Reference
          if (poseBase64) {
            contents.unshift({
               inlineData: {
                  data: poseBase64.split(",")[1],
                  mimeType: "image/png"
               }
            });
            contents.unshift({ text: "Use this image as the ACTION/POSE reference:" });
          }

          const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-image",
            contents: { parts: contents },
            config: {
               imageConfig: {
                  aspectRatio: "1:1"
               }
            }
          });

          let imageUrl = "";
          let base64 = "";
          for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              base64 = part.inlineData.data;
              imageUrl = `data:image/png;base64,${base64}`;
              break;
            }
          }

          return { url: imageUrl, prompt: v, base64 };
        } catch (err) {
          console.error(`Error generating variation ${v}:`, err);
          return null;
        }
      });

      const results = await Promise.all(generationPromises);
      setPrototypes(results.filter(r => r !== null) as any);
    } catch (err) {
      console.error("Synthesis Error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const imageUrlToBase64 = async (url: string): Promise<string> => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (err) {
      console.error("Image to Base64 Error:", err);
      return "";
    }
  };

  const handleAddToDatabase = async (proto: { url: string, prompt: string, base64: string }) => {
     setAddingToDatabase(proto.url);
     try {
        const formData = new FormData();
        formData.append('verb_name', `${prompt.toUpperCase().replace(/\s+/g, '_')}_${proto.prompt.toUpperCase().replace(/\s+/g, '_')}`);
        formData.append('category', 'Synthetic');
        formData.append('frame_urls', JSON.stringify([proto.url]));

        const res = await fetch('/api/actions', {
           method: 'POST',
           body: formData
        });
        const data = await res.json();
        if (data.success) {
           onRefresh();
        }
     } catch (err) {
        console.error("Error adding to database:", err);
     } finally {
        setAddingToDatabase(null);
     }
  };

  return (
    <div className="p-4 md:p-12 max-w-[1600px] mx-auto animate-in fade-in duration-1000">
      <header className="flex flex-col md:flex-row items-end justify-between gap-8 mb-16 relative p-12 bg-white border border-theme-border rounded-[40px] shadow-2xl shadow-theme-accent/5 overflow-hidden">
         {/* Decorative Background Elements */}
         <div className="absolute top-0 right-0 w-64 h-64 bg-theme-accent/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
         <div className="absolute bottom-0 left-0 w-32 h-32 border-4 border-theme-accent/10 rounded-full -translate-x-1/2 translate-y-1/2" />
         
         <div className="relative z-10 w-full md:w-auto">
            <div className="flex items-center gap-4 mb-4">
               <div className="p-3 bg-theme-accent rounded-2xl shadow-lg shadow-theme-accent/30">
                  <Sparkles className="w-6 h-6 text-white" />
               </div>
               <div>
                  <h2 className="text-2xl italic font-black uppercase tracking-tight text-theme-text">{t('proto_h')}</h2>
                  <p className="text-[10px] uppercase tracking-[0.4em] text-theme-accent font-black font-mono">{t('proto_sh')} / Sakura_System_Core</p>
               </div>
            </div>
            
            <div className="flex flex-col md:flex-row gap-6 mt-8">
               <div className="flex flex-col gap-2">
                  <label className="text-[9px] uppercase tracking-widest font-black text-theme-muted font-mono ml-2">{t('proto_input')}</label>
                  <input 
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    placeholder="e.g. Walking Straight Girl, Silver Hair..."
                    className="w-full md:w-[400px] bg-theme-bg border-2 border-theme-border rounded-2xl px-6 py-4 text-sm focus:outline-none focus:border-theme-accent transition-all text-theme-text font-mono placeholder:opacity-30 shadow-inner"
                  />
               </div>

               <div className="flex flex-col gap-2">
                  <label className="text-[9px] uppercase tracking-widest font-black text-theme-muted font-mono ml-2">Character_Reference</label>
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14 bg-theme-bg border-2 border-dashed border-theme-border rounded-xl flex items-center justify-center group hover:border-theme-accent/50 transition-all overflow-hidden flex-shrink-0">
                      {characterRef ? (
                        <img src={characterRef} className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-5 h-5 text-theme-muted" />
                      )}
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) setCharacterRef(URL.createObjectURL(file));
                      }} />
                    </div>
                    <div>
                      <p className="text-[8px] uppercase font-bold text-theme-muted mb-1">Consistency_Ref</p>
                      <button onClick={() => setCharacterRef(null)} className="text-[7px] uppercase font-black text-theme-accent hover:text-theme-text transition-colors">Clear_Buffer</button>
                    </div>
                  </div>
               </div>
            </div>
         </div>

         <div className="flex flex-col gap-4 relative z-10 w-full md:w-auto">
            <div className="flex gap-2 p-1 bg-theme-bg rounded-xl border border-theme-border">
              <button 
                onClick={() => setGenMode('variations')}
                className={`flex-1 py-2 px-4 rounded-lg text-[9px] font-black uppercase transition-all ${genMode === 'variations' ? 'bg-theme-accent text-white shadow-lg' : 'text-theme-muted hover:text-theme-text'}`}
              >Variations</button>
              <button 
                onClick={() => setGenMode('sequence')}
                className={`flex-1 py-2 px-4 rounded-lg text-[9px] font-black uppercase transition-all ${genMode === 'sequence' ? 'bg-theme-accent text-white shadow-lg' : 'text-theme-muted hover:text-theme-text'}`}
              >Sequence</button>
            </div>

            <div className="flex flex-col gap-2">
               <label className="text-[9px] uppercase tracking-widest font-black text-theme-muted font-mono ml-2">{t('proto_reference')}</label>
               <select 
                 value={selectedReferenceId}
                 onChange={e => setSelectedReferenceId(e.target.value)}
                 className="w-full md:w-64 bg-theme-bg border-2 border-theme-border rounded-xl px-4 py-3 text-[11px] focus:outline-none focus:border-theme-accent transition-all text-theme-text font-mono appearance-none uppercase font-black"
               >
                 <option value="">{t('select_db')}</option>
                 {actions.map(a => (
                   <option key={a.id} value={a.id}>{a.verb_name}</option>
                 ))}
               </select>
            </div>
            <button 
              onClick={handleSynthesize}
              disabled={isGenerating || !prompt}
              className={`w-full py-4 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${isGenerating ? 'bg-theme-bg text-theme-muted cursor-not-allowed border-2 border-theme-border' : 'bg-theme-accent text-white hover:bg-theme-text shadow-theme-accent/30'}`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('synthesizing')}
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-current" />
                  {t('proto_exec')}
                </>
              )}
            </button>
         </div>
      </header>

      <section>
        <div className="flex items-center justify-between mb-8">
           <div className="flex items-center gap-3">
              <Layers className="w-5 h-5 text-theme-accent" />
              <h3 className="text-sm uppercase font-black tracking-widest text-theme-text italic">{t('proto_fabrication')}</h3>
           </div>
           <div className="px-4 py-1.5 bg-theme-bg border border-theme-border rounded-full text-[10px] font-black text-theme-muted font-mono uppercase tracking-widest">{t('proto_nodes')}: {prototypes.length}</div>
        </div>

        {isGenerating ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="aspect-square bg-theme-bg border-2 border-theme-border border-dashed rounded-3xl flex flex-col items-center justify-center gap-4 animate-pulse">
                <div className="w-12 h-12 bg-theme-accent/10 rounded-full flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-theme-accent/30" />
                </div>
                <div className="w-24 h-2 bg-theme-accent/10 rounded-full"></div>
              </div>
            ))}
          </div>
        ) : prototypes.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {prototypes.map((proto, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="group bg-white border border-theme-border rounded-3xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all"
              >
                 <div className="aspect-square relative overflow-hidden bg-white">
                    <img src={proto.url} className="w-full h-full object-cover saturate-50 group-hover:saturate-100 transition-all duration-500" />
                    <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                       <button onClick={() => setZoomImage(proto.url)} className="p-2 bg-white/90 backdrop-blur-md rounded-xl text-theme-text shadow-lg hover:bg-theme-accent hover:text-white transition-all">
                          <Maximize2 className="w-4 h-4" />
                       </button>
                       <a href={proto.url} download={`${prompt}_${proto.prompt}.png`} className="p-2 bg-white/90 backdrop-blur-md rounded-xl text-theme-text shadow-lg hover:bg-theme-accent hover:text-white transition-all">
                          <Download className="w-4 h-4" />
                       </a>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3">
                       <button 
                         onClick={() => handleAddToDatabase(proto)}
                         disabled={addingToDatabase === proto.url}
                         className={`w-full py-2.5 rounded-xl text-[9px] uppercase font-black tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all ${addingToDatabase === proto.url ? 'bg-theme-muted text-white' : 'bg-theme-text text-white hover:bg-theme-accent'}`}
                       >
                         {addingToDatabase === proto.url ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                         {addingToDatabase === proto.url ? t('processing') : t('proto_add_db')}
                       </button>
                    </div>
                 </div>
                 <div className="p-4 border-t border-theme-border bg-theme-bg/30">
                    <div className="text-[9px] font-black font-mono uppercase text-theme-muted tracking-widest flex items-center gap-2">
                       <Camera className="w-3 h-3" /> {proto.prompt}
                    </div>
                 </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-32 bg-theme-bg/50 border-2 border-dashed border-theme-border rounded-[40px]">
             <div className="w-20 h-20 bg-theme-accent/5 rounded-full flex items-center justify-center mb-8 relative">
                <ImageIcon className="w-8 h-8 text-theme-accent/40" />
             </div>
             <h3 className="text-xl uppercase tracking-[0.3em] mb-3 font-black text-theme-text italic opacity-40">{t('ready_synthesis')}</h3>
             <p className="text-[10px] uppercase tracking-[0.2em] text-theme-muted font-black font-mono">{t('synthesis_desc')}</p>
          </div>
        )}
      </section>

      {/* Zoom Modal */}
      <AnimatePresence>
        {zoomImage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-8">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setZoomImage(null)} className="absolute inset-0 bg-theme-bg/95 backdrop-blur-2xl" />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full aspect-square bg-white border border-theme-border rounded-[40px] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]"
            >
              <img src={zoomImage} className="w-full h-full object-contain" />
              <button 
                onClick={() => setZoomImage(null)}
                className="absolute top-8 right-8 w-12 h-12 bg-white/10 hover:bg-theme-accent rounded-full flex items-center justify-center text-theme-text hover:text-white transition-all backdrop-blur-lg border border-theme-border"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="absolute bottom-8 left-8 right-8 bg-white/80 backdrop-blur-md p-6 rounded-3xl border border-theme-border shadow-2xl flex justify-between items-center">
                 <div>
                    <h4 className="text-lg font-black uppercase tracking-tight text-theme-text italic">{prompt || t('proto_unnamed')}</h4>
                    <p className="text-[10px] uppercase font-mono text-theme-muted tracking-widest font-black">{t('proto_hi_fi')}</p>
                 </div>
                 <a href={zoomImage} download="prototype.png" className="px-8 py-4 bg-theme-accent text-white rounded-2xl font-black text-[12px] uppercase tracking-widest hover:bg-theme-text transition-all flex items-center gap-3">
                   <Download className="w-5 h-5" /> {t('export_pkg')}
                 </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function AuthModal({ isOpen, onClose, onLogin, t }: { isOpen: boolean, onClose: () => void, onLogin: () => void, t: any }) {
  const [username, setUsername] = useState('animator');
  const [password, setPassword] = useState('survivalhorror');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (data.success) {
      onLogin();
      onClose();
    } else {
      setError(data.message);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-white/80 backdrop-blur-xl" />
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white border border-theme-border rounded-3xl p-12 w-full max-w-sm shadow-[0_0_80px_rgba(255,183,197,0.2)] overflow-hidden">
         {/* Decorative Japanese Fan Accent */}
         <div className="absolute -top-10 -right-10 w-32 h-32 bg-theme-accent/10 rounded-full blur-2xl"></div>
         
         <div className="w-20 h-20 bg-theme-bg border-4 border-theme-accent rounded-full mx-auto mb-10 flex items-center justify-center shadow-lg group">
            <Lock className="text-theme-accent w-8 h-8 group-hover:scale-110 transition-transform" />
         </div>
         <h2 className="text-center text-xl italic uppercase font-black tracking-[0.4em] text-theme-text mb-10">{t('auth_terminal')}</h2>
         <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase text-theme-muted tracking-widest ml-1 font-mono">{t('field_admin_id')}</label>
              <input 
                value={username} onChange={e => setUsername(e.target.value)}
                placeholder="SAKURA_USER" className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-theme-accent-blue transition-all text-theme-text font-mono placeholder:opacity-40" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[8px] font-black uppercase text-theme-muted tracking-widest ml-1 font-mono">{t('field_security_hash')}</label>
              <input 
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="********" className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-4 text-sm focus:outline-none focus:border-theme-accent-blue transition-all text-theme-text font-mono placeholder:opacity-40" 
              />
            </div>
            {error && <p className="text-[10px] text-red-500 text-center uppercase tracking-widest font-black font-mono p-3 bg-red-500/5 border border-red-500/20 rounded-xl italic">{error}</p>}
            <button type="submit" className="w-full py-5 bg-theme-accent text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] mt-6 hover:bg-theme-text transition-all shadow-xl shadow-theme-accent/20 active:scale-95">{t('establish_auth')}</button>
            <button type="button" onClick={onClose} className="w-full text-[9px] text-theme-muted font-black uppercase tracking-[0.2em] mt-6 hover:text-theme-accent transition-colors">{t('abort')}</button>
         </form>
      </motion.div>
    </div>
  );
}


// ==========================================
// CUSTOM BRANDING & ANIMATED PET MASCOT
// ==========================================

function LighthouseLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 100 120" 
      className={className} 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Lighthouse Beam/Glow */}
      <path 
        d="M 50 25 L 10 90 L 90 90 Z" 
        fill="url(#beamGlow)" 
        opacity="0.15"
      />
      
      {/* Waves at the bottom */}
      <path 
        d="M 12 105 C 32 101, 38 111, 58 107 C 78 103, 82 109, 88 105" 
        stroke="var(--color-theme-accent-blue)" 
        strokeWidth="4" 
        strokeLinecap="round" 
        fill="none"
      />
      <path 
        d="M 16 111 C 30 108, 38 115, 52 112 C 66 109, 76 114, 84 111" 
        stroke="var(--color-theme-accent-blue)" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        fill="none"
        opacity="0.6"
      />

      {/* Lighthouse Tower Structure */}
      {/* Foundation */}
      <path d="M 28 102 L 72 102 L 68 95 L 32 95 Z" fill="var(--color-theme-text)" />
      
      {/* Tower body (Stripes) */}
      <path d="M 33 95 L 67 95 L 64 75 L 36 75 Z" fill="#ffffff" stroke="var(--color-theme-text)" strokeWidth="2.5" strokeLinejoin="round" />
      <path d="M 36 75 L 64 75 L 61 55 L 39 55 Z" fill="var(--color-theme-text)" />
      <path d="M 39 55 L 61 55 L 59 38 L 41 38 Z" fill="#ffffff" stroke="var(--color-theme-text)" strokeWidth="2.5" strokeLinejoin="round" />
      
      {/* Gallery Deck */}
      <path d="M 36 38 L 64 38 L 62 34 L 38 34 Z" fill="var(--color-theme-text)" />
      <rect x="42" y="34" width="16" height="1" fill="#ffffff" />
      
      {/* Lantern House (Light) */}
      <rect x="44" y="24" width="12" height="10" rx="1" fill="#ffffff" stroke="var(--color-theme-text)" strokeWidth="2" />
      {/* Golden Light Bulb */}
      <circle cx="50" cy="29" r="3.5" fill="#FBBF24" />

      {/* Dome Top */}
      <rect x="49" y="10" width="2" height="6" fill="var(--color-theme-text)" />
      <path d="M 43 24 C 43 15, 57 15, 57 24 Z" fill="var(--color-theme-accent)" stroke="var(--color-theme-text)" strokeWidth="1.5" />
      
      {/* Spiral Wave Accent */}
      <path 
        d="M 36 75 C 45 78, 55 72, 64 75" 
        stroke="var(--color-theme-accent-blue)" 
        strokeWidth="2.5" 
        strokeLinecap="round" 
        fill="none" 
      />

      <defs>
        <radialGradient id="beamGlow" cx="50%" cy="25%" r="75%">
          <stop offset="0%" stopColor="#FBBF24" />
          <stop offset="100%" stopColor="#FBBF24" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function KoppiPet({ state = 'idle', className = "w-24 h-24" }: { state?: 'idle' | 'thinking' | 'speaking' | 'greeting' | 'error', className?: string }) {
  // Blinking animation for eyes (scaleY goes to 0 briefly)
  const blinkTransition = {
    scaleY: {
      repeat: Infinity,
      repeatType: "loop" as const,
      duration: 3.5,
      times: [0, 0.9, 0.92, 0.95, 1],
      values: [1, 1, 0.1, 1, 1]
    }
  };

  // Bobbing animation for the body
  const bodyBob = {
    y: state === 'thinking' ? [0, -1.5, 0] : state === 'speaking' ? [0, -4.5, 0] : state === 'greeting' ? [0, -6, 0] : [0, -3.5, 0],
    rotate: state === 'thinking' ? [-2, 2, -2] : state === 'error' ? [-1, 1, -1] : [0, 0],
    transition: {
      duration: state === 'thinking' ? 1.8 : state === 'speaking' ? 0.75 : state === 'greeting' ? 0.6 : 3.2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  };

  // Left paw gesture based on state/pose
  const leftPawAnimate = state === 'thinking' 
    ? { x: 5, y: -15, rotate: -35 } // chin touch pose
    : state === 'greeting' 
    ? { y: -18, x: -5, rotate: [0, -50, -10, -50, 0], transition: { duration: 0.65, repeat: Infinity } } // high wave
    : state === 'speaking' 
    ? { y: -5, rotate: [0, -25, 5, -25, 0], transition: { duration: 0.8, repeat: Infinity } } // expressive explanation
    : state === 'error' 
    ? { x: [0, -1, 1, -1, 0], y: 1, transition: { duration: 0.4, repeat: Infinity } } // shiver
    : { y: [0, -2, 0], transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut" } }; // breathing

  // Right paw gesture based on state/pose
  const rightPawAnimate = state === 'greeting' 
    ? { y: -18, x: 5, rotate: [0, 50, 10, 50, 0], transition: { duration: 0.65, repeat: Infinity, delay: 0.15 } } // opposite high wave
    : state === 'speaking' 
    ? { y: -5, rotate: [0, 25, -5, 25, 0], transition: { duration: 0.8, repeat: Infinity, delay: 0.2 } } 
    : state === 'error' 
    ? { x: [0, 1, -1, 1, 0], y: 1, transition: { duration: 0.4, repeat: Infinity, delay: 0.1 } } 
    : { y: [0, -2, 0], transition: { duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.3 } };

  // Head group rotation/leaning translation
  const headState = state === 'thinking' 
    ? { rotate: 8, x: 1 } 
    : state === 'error' 
    ? { rotate: -6, y: 2 } 
    : state === 'greeting' 
    ? { y: [-1, 2, -1], transition: { duration: 0.6, repeat: Infinity } } 
    : { rotate: 0, x: 0 };

  const isBlinking = state !== 'thinking' && state !== 'speaking' && state !== 'greeting' && state !== 'error';

  return (
    <div className={`relative ${className} flex items-center justify-center select-none`}>
      <motion.svg
        viewBox="0 0 100 100"
        className="w-full h-full overflow-visible"
        animate={bodyBob}
      >
        {/* Ambient indicator lights or glow */}
        <defs>
          <radialGradient id="cheekGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#FFAAA6" stopOpacity="1" />
            <stop offset="100%" stopColor="#FFAAA6" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Shadow under mascot */}
        <ellipse cx="50" cy="92" rx="28" ry="5" fill="rgba(44, 37, 24, 0.12)" />

        {/* --- Ears --- */}
        {/* Left Ear */}
        <motion.g animate={headState} style={{ transformOrigin: "50px 52px" }}>
          <motion.path 
            d="M 22 36 C 8 26, 12 8, 28 14 Z" 
            fill="#8FE3F1" 
            stroke="var(--color-theme-text, #2C2518)" 
            strokeWidth="3.5" 
            strokeLinejoin="round"
            animate={state === 'greeting' ? { rotate: [-10, 5, -10] } : state === 'error' ? { rotate: -15 } : { rotate: 0 }}
            transition={{ duration: 0.4, repeat: state === 'greeting' ? Infinity : 0, repeatType: "reverse" }}
            style={{ transformOrigin: "26px 31px" }}
          />
          <path d="M 23 31 C 14 24, 17 14, 26 18 Z" fill="#FFB7C5" />
        </motion.g>

        {/* Right Ear */}
        <motion.g animate={headState} style={{ transformOrigin: "50px 52px" }}>
          <motion.path 
            d="M 78 36 C 92 26, 88 8, 72 14 Z" 
            fill="#8FE3F1" 
            stroke="var(--color-theme-text, #2C2518)" 
            strokeWidth="3.5" 
            strokeLinejoin="round"
            animate={state === 'greeting' ? { rotate: [10, -5, 10] } : state === 'error' ? { rotate: 15 } : { rotate: 0 }}
            transition={{ duration: 0.4, repeat: state === 'greeting' ? Infinity : 0, repeatType: "reverse" }}
            style={{ transformOrigin: "74px 31px" }}
          />
          <path d="M 77 31 C 86 24, 83 14, 74 18 Z" fill="#FFB7C5" />
        </motion.g>

        {/* --- Head and Body Group --- */}
        <motion.g animate={headState} style={{ transformOrigin: "50px 65px" }}>
          {/* Main Body (rounded light-blue chubby avatar structure) */}
          <path 
            d="M 16 52 C 16 34, 30 26, 50 26 C 70 26, 84 34, 84 52 C 84 72, 78 88, 50 88 C 22 88, 16 72, 16 52 Z" 
            fill="#8FE3F1" 
            stroke="var(--color-theme-text, #2C2518)" 
            strokeWidth="3.5" 
            strokeLinejoin="round"
          />

          {/* Dynamic Cheek Blush (releasing subtle aura sparkles or expanding on excited) */}
          <motion.circle 
            cx="27" 
            cy="63" 
            r={state === 'greeting' || state === 'speaking' ? "9.5" : "7.5"} 
            fill="url(#cheekGlow)" 
            animate={state === 'speaking' ? { scale: [1, 1.15, 1] } : { opacity: [0.8, 1, 0.8] }}
            transition={{ duration: state === 'speaking' ? 0.5 : 2, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.circle 
            cx="73" 
            cy="63" 
            r={state === 'greeting' || state === 'speaking' ? "9.5" : "7.5"} 
            fill="url(#cheekGlow)" 
            animate={state === 'speaking' ? { scale: [1, 1.15, 1] } : { opacity: [0.8, 1, 0.8] }}
            transition={{ duration: state === 'speaking' ? 0.5 : 2, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Whiskers (thin face accent detail) */}
          <line x1="17" y1="65" x2="21" y2="65" stroke="var(--color-theme-text, #2C2518)" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="18" y1="68" x2="22" y2="69" stroke="var(--color-theme-text, #2C2518)" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="83" y1="65" x2="79" y2="65" stroke="var(--color-theme-text, #2C2518)" strokeWidth="1.8" strokeLinecap="round" />
          <line x1="82" y1="68" x2="78" y2="69" stroke="var(--color-theme-text, #2C2518)" strokeWidth="1.8" strokeLinecap="round" />

          {/* --- Eyes rendering based on active state --- */}
          {/* Left Eye */}
          <g transform="translate(35, 48)">
            {state === 'greeting' ? (
              /* Playful Happy Squint/Wink */
              <path 
                d="M -7 2 Q 0 -3, 7 2" 
                stroke="var(--color-theme-text, #2C2518)" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                fill="none" 
              />
            ) : state === 'speaking' ? (
              /* Happy Joyous arch eyes */
              <motion.path 
                d="M -7 2 Q 0 -4, 7 2" 
                stroke="var(--color-theme-text, #2C2518)" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                fill="none"
                animate={{ scaleY: [1, 1.2, 0.9, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
            ) : state === 'error' ? (
              /* Dizzy cross spiral or cartoon distress '> <' */
              <path 
                d="M -5 -4 L 1 2 L -5 8" 
                stroke="var(--color-theme-text, #2C2518)" 
                strokeWidth="3.2" 
                strokeLinecap="round" 
                fill="none" 
              />
            ) : (
              /* Interactive Shiny Black Eyes (Double sparkles matched to exact illustration) */
              <motion.g
                animate={state === 'thinking' ? { x: -2.5, y: -3, scaleY: 0.9 } : isBlinking ? blinkTransition : {}}
                style={{ transformOrigin: "center" }}
              >
                <circle cx="0" cy="0" r="10" fill="var(--color-theme-text, #2C2518)" />
                {/* Large sparkle (top left) */}
                <circle cx="-3.2" cy="-3.2" r="3.2" fill="#ffffff" />
                {/* Secondary companion sparkle (bottom left) */}
                <circle cx="-3.2" cy="3.2" r="1.6" fill="#ffffff" />
              </motion.g>
            )}
          </g>

          {/* Right Eye */}
          <g transform="translate(65, 48)">
            {state === 'error' ? (
              /* Cartoon distress '> <' */
              <path 
                d="M 5 -4 L -1 2 L 5 8" 
                stroke="var(--color-theme-text, #2C2518)" 
                strokeWidth="3.2" 
                strokeLinecap="round" 
                fill="none" 
              />
            ) : state === 'speaking' ? (
              /* Happy Joyous arch eyes */
              <motion.path 
                d="M -7 2 Q 0 -4, 7 2" 
                stroke="var(--color-theme-text, #2C2518)" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                fill="none" 
                animate={{ scaleY: [1, 1.2, 0.9, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
              />
            ) : (
              /* Shiny Eye (Even when left is winking, right stays open in greeting) */
              <motion.g
                animate={state === 'thinking' ? { x: 2.5, y: -3, scaleY: 0.9 } : isBlinking ? blinkTransition : {}}
                style={{ transformOrigin: "center" }}
              >
                <circle cx="0" cy="0" r="10" fill="var(--color-theme-text, #2C2518)" />
                {/* Large sparkle (top left) */}
                <circle cx="-3.2" cy="-3.2" r="3.2" fill="#ffffff" />
                {/* Secondary companion sparkle (bottom left) */}
                <circle cx="-3.2" cy="3.2" r="1.6" fill="#ffffff" />
              </motion.g>
            )}
          </g>

          {/* --- Cute Mouth shapes --- */}
          <g transform="translate(50, 56)">
            {state === 'greeting' ? (
              /* Wide open laughing/singing mouth with tongue */
              <path 
                d="M -5 0 Q 0 -1, 5 0 L 4.5 4 C 3.5 7.5, -3.5 7.5, -4.5 4 Z" 
                fill="#FF5A79" 
                stroke="var(--color-theme-text, #2C2518)" 
                strokeWidth="2" 
                strokeLinejoin="round" 
              />
            ) : state === 'speaking' ? (
              /* Dynamic oval speaking mouth */
              <motion.ellipse 
                cx="0" 
                cy="1" 
                rx="3.5" 
                ry="1.8" 
                fill="var(--color-theme-text, #2C2518)" 
                animate={{ ry: [1, 3.8, 1] }} 
                transition={{ duration: 0.28, repeat: Infinity }} 
              />
            ) : state === 'error' ? (
              /* Sad squiggly mouth or worry line */
              <path 
                d="M -4 2 Q 0 -1, 4 2" 
                stroke="var(--color-theme-text, #2C2518)" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                fill="none" 
              />
            ) : state === 'thinking' ? (
              /* Concentrating little circle mouth */
              <ellipse 
                cx="0"  
                cy="1" 
                rx="2" 
                ry="2" 
                fill="var(--color-theme-text, #2C2518)" 
              />
            ) : (
              /* Standard super-cute curved "ω" mouth */
              <path 
                d="M -4 1 Q -2 3.5, 0 1 Q 2 3.5, 4 1" 
                stroke="var(--color-theme-text, #2C2518)" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                fill="none" 
              />
            )}
          </g>
        </motion.g>

        {/* --- Hand Paws Poses with custom kinematics --- */}
        {/* Left Paw */}
        <g transform="translate(25, 75)">
          <motion.g
            animate={leftPawAnimate}
            style={{ transformOrigin: "top right" }}
          >
            <path 
              d="M 0 0 C 4 0, 4 11, 0 11 C -4 11, -4 0, 0 0" 
              fill="#8FE3F1" 
              stroke="var(--color-theme-text, #2C2518)" 
              strokeWidth="2.5" 
              strokeLinecap="round"
            />
          </motion.g>
        </g>

        {/* Right Paw */}
        <g transform="translate(75, 75)">
          <motion.g
            animate={rightPawAnimate}
            style={{ transformOrigin: "top left" }}
          >
            <path 
              d="M 0 0 C -4 0, -4 11, 0 11 C 4 11, 4 0, 0 0" 
              fill="#8FE3F1" 
              stroke="var(--color-theme-text, #2C2518)" 
              strokeWidth="2.5" 
              strokeLinecap="round"
            />
          </motion.g>
        </g>

        {/* --- Floating Visual Accents, Auric and Mood Emblems --- */}
        {/* Thought cloud (Thinking) */}
        {state === 'thinking' && (
          <motion.g
            initial={{ opacity: 0, scale: 0.5, y: 10 }}
            animate={{ opacity: [0, 1, 1, 0], y: [0, -12, -22, -28], scale: [0.7, 1.1, 1.05, 0.8] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
            transform="translate(76, 12)"
          >
            {/* White bubbles overlay */}
            <path d="M -5 0 C -10 -4, -4 -10, 2 -8 C 8 -10, 10 -2, 5 1 C 6 5, 0 7, -3 3 Z" fill="white" stroke="#2C2518" strokeWidth="1.5" />
            <circle cx="-1" cy="8" r="2.2" fill="white" stroke="#2C2518" strokeWidth="1.2" />
            <circle cx="-5" cy="13" r="1.2" fill="white" stroke="#2C2518" strokeWidth="0.8" />
            <text x="1" y="-1.5" fontSize="7" fontWeight="bold" fill="#FF5A79" textAnchor="middle" fontFamily="monospace">?</text>
          </motion.g>
        )}

        {/* Blooming Sweet Hearts (Speaking/Active) */}
        {state === 'speaking' && (
          <>
            <motion.g
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: [0, 1, 0], y: [-5, -28], x: [0, -7], scale: [0.5, 1.1, 0.7] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
              transform="translate(18, 52)"
            >
              <path d="M 0 0 C -2 -3, -5 -2, -4 1 L 0 5 L 4 1 C 5 -2, 2 -3, 0 0" fill="#FF8295" stroke="#2C2518" strokeWidth="1" />
            </motion.g>
            <motion.g
              initial={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: [0, 1, 0], y: [-4, -26], x: [0, 8], scale: [0.5, 1.1, 0.7] }}
              transition={{ duration: 1.6, repeat: Infinity, delay: 0.8, ease: "easeOut" }}
              transform="translate(82, 52)"
            >
              <path d="M 0 0 C -2 -3, -5 -2, -4 1 L 0 5 L 4 1 C 5 -2, 2 -3, 0 0" fill="#FFAEC9" stroke="#2C2518" strokeWidth="1" />
            </motion.g>
          </>
        )}

        {/* Magic Sparkles / Star Burst (Excited Greeting) */}
        {state === 'greeting' && (
          <>
            <motion.g
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: [0, 1, 0], scale: [0.4, 1.25, 0.5], rotate: [0, 120] }}
              transition={{ duration: 1.3, repeat: Infinity }}
              transform="translate(14, 24)"
            >
              <path d="M 0,-7 Q 0,0 7,0 Q 0,0 0,7 Q 0,0 -7,0 Q 0,0 0,-7 Z" fill="#E6BF5C" stroke="#2C2518" strokeWidth="1" />
            </motion.g>
            <motion.g
              initial={{ opacity: 0, scale: 0.3 }}
              animate={{ opacity: [0, 1, 0], scale: [0.4, 1.25, 0.5], rotate: [0, -120] }}
              transition={{ duration: 1.3, repeat: Infinity, delay: 0.65 }}
              transform="translate(86, 24)"
            >
              <path d="M 0,-7 Q 0,0 7,0 Q 0,0 0,7 Q 0,0 -7,0 Q 0,0 0,-7 Z" fill="#E6BF5C" stroke="#2C2518" strokeWidth="1" />
            </motion.g>
          </>
        )}

        {/* Anxiety Sweat Drop (Error/Trouble) */}
        {state === 'error' && (
          <motion.g
            initial={{ opacity: 0, y: -4, scale: 0.7 }}
            animate={{ opacity: [0, 1, 1, 0], y: [0, 9, 18], scale: [0.8, 1.1, 0.9] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            transform="translate(25, 38)"
          >
            <path d="M 0,-3.5 C -2.2,-0.5 -2.2,2.5 0,2.5 C 2.2,2.5 2.2,-0.5 0,-3.5 Z" fill="#59D5E0" stroke="#2C2518" strokeWidth="1" />
          </motion.g>
        )}
      </motion.svg>
    </div>
  );
}

function KoppiChatbot({ lang }: { lang: 'en' | 'jp' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant' | 'model'; content: string }>>([]);
  const [petState, setPetState] = useState<'idle' | 'thinking' | 'speaking' | 'greeting'>('idle');
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const tKoppi = {
    en: {
      btnLabel: "Chat with Koppi!",
      placeholder: "Ask Koppi about database...",
      firstMsg: "Konnichiwa, Senpai! I'm Koppi, your custom service companion assistant! Kyuu! Ask me anything about our database, weapon fusion, or pose retargeter! Ganbatte! Mew!"
    },
    jp: {
      btnLabel: "コッピと話そう！",
      placeholder: "コッピに聞いてみる...",
      firstMsg: "センパイ、こんにちは！コッピがお手伝いするよ！キュゥ！データベースの稼働状況や、各機能の使い方ならなんでも聞いてね！ガンバッテ！ミュー！"
    }
  }[lang];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([{ role: 'assistant', content: tKoppi.firstMsg }]);
    }
  }, [lang]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userText = inputValue;
    setInputValue("");
    
    const updatedMessages = [...messages, { role: 'user', content: userText } as const];
    setMessages(updatedMessages);
    setIsLoading(true);
    setPetState('thinking');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages: updatedMessages }),
      });
      const data = await response.json();
      
      setMessages([...updatedMessages, { role: 'assistant', content: data.text }]);
      
      setPetState('speaking');
      setTimeout(() => {
        setPetState('idle');
      }, Math.min(6000, Math.max(2500, data.text.length * 55)));

    } catch (err) {
      console.error(err);
      setMessages([...updatedMessages, { role: 'assistant', content: "Kyuu... Something interrupted my thoughts! Please try again. Mew!" }]);
      setPetState('error');
      setTimeout(() => {
        setPetState('idle');
      }, 4000);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[150] flex flex-col items-end pointer-events-auto">
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.85, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: 50 }}
            className="w-[325px] sm:w-[360px] h-[450px] bg-theme-surface border-2 border-theme-border rounded-[32px] overflow-hidden shadow-[0_15px_50px_rgba(44,37,24,0.15)] flex flex-col mb-4 select-none"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-theme-bg to-theme-border-light px-5 py-3.5 flex items-center justify-between border-b border-theme-border relative">
              <div className="absolute top-0 right-10 w-20 h-20 bg-theme-accent/5 rounded-full blur-xl pointer-events-none"></div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FEFBD9] border-2 border-theme-border rounded-full flex items-center justify-center overflow-hidden shadow-md">
                  <KoppiPet state={petState} className="w-9 h-9" />
                </div>
                <div>
                  <h4 className="text-[11px] uppercase font-black font-mono tracking-widest text-[#2C2518] flex items-center gap-1.5">
                    Koppi <span className="text-[7.5px] px-1.5 py-0.5 bg-theme-accent text-white rounded-full font-black scale-90 animate-pulse">LIVE</span>
                  </h4>
                  <p className="text-[8px] uppercase font-mono tracking-wider font-semibold text-theme-muted">{lang === 'jp' ? "マスコット・コンパニオン" : "Support mascot"}</p>
                </div>
              </div>

              <button 
                onClick={() => setIsOpen(false)}
                className="w-7 h-7 bg-theme-surface hover:bg-theme-accent hover:text-white rounded-full border border-theme-border flex items-center justify-center text-theme-muted transition-all active:scale-95 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-white to-theme-bg/10 custom-scrollbar">
              {messages.map((m, index) => (
                <div key={index} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] p-3 rounded-xl text-[10.5px] leading-relaxed relative ${m.role === 'user' ? 'bg-[#FFECEF] border border-theme-accent/25 text-theme-text rounded-tr-none' : 'bg-theme-surface border border-theme-border text-theme-text rounded-tl-none shadow-sm'}`}>
                    <div className={`absolute top-0 w-2 h-2 ${m.role === 'user' ? '-right-1 border-t border-r border-theme-accent/20 bg-[#FFECEF]' : '-left-1 border-t border-l border-theme-border bg-white'} rotate-45`}></div>
                    <p className="whitespace-pre-line tracking-wide font-sans">{m.content}</p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-theme-surface border border-theme-border p-2 px-3 rounded-xl rounded-tl-none flex items-center gap-2 text-theme-muted text-[9px] font-mono shadow-sm">
                    <Loader2 className="w-3 h-3 animate-spin text-theme-accent" />
                    Koppi is typing...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input form */}
            <form onSubmit={handleSend} className="p-3 border-t border-theme-border bg-theme-surface flex gap-1.5">
              <input 
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                placeholder={tKoppi.placeholder}
                disabled={isLoading}
                className="flex-1 bg-theme-bg/60 border border-theme-border rounded-xl px-3.5 py-2.5 text-[10.5px] focus:outline-none focus:border-theme-accent focus:bg-white transition-all text-theme-text placeholder:text-theme-muted/70 font-mono"
              />
              <button 
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="w-10 h-10 bg-theme-accent hover:bg-theme-text rounded-xl flex items-center justify-center text-white transition-all shadow-md shadow-theme-accent/20 hover:shadow-none active:scale-95 disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 fill-white" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Circle Mascot Button */}
      <button 
        onClick={() => {
          setIsOpen(!isOpen);
          if (petState === 'idle') {
            setPetState('greeting');
            setTimeout(() => setPetState('idle'), 1200);
          }
        }}
        className="w-14 h-14 bg-[#FEFBD9] border-4 border-theme-border rounded-full flex items-center justify-center overflow-hidden hover:scale-105 active:scale-95 transition-all shadow-[0_8px_30px_rgba(232,221,188,0.5)] cursor-pointer group relative"
      >
        {!isOpen && (
          <span className="absolute top-0 right-0 w-3 h-3 bg-theme-accent border-2 border-white rounded-full animate-bounce z-10"></span>
        )}
        <KoppiPet state={isOpen ? 'speaking' : petState} className="w-12 h-12" />
        
        {!isOpen && (
          <div className="absolute right-16 bg-theme-surface border border-theme-border py-1 px-3 rounded-lg text-[8px] uppercase tracking-wider font-mono font-black text-theme-text whitespace-nowrap shadow-md opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 pointer-events-none flex items-center gap-1 leading-none">
            {tKoppi.btnLabel} <Sparkles className="w-2 h-2 text-theme-accent fill-theme-accent" />
          </div>
        )}
      </button>
    </div>
  );
}

