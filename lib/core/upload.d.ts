interface File extends Blob {
    readonly lastModified: number;
    readonly name: string;
    readonly webkitRelativePath: string;
    size: number;
}
declare function upload(provider: any, address: any, file: File | string, dirPath?: string): Promise<void>;
export default upload;
